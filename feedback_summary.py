#!/usr/bin/env python3
"""Build a Hub CPD feedback summary from a workbook.

Run from this folder:

    python feedback_summary.py

The sheet's room, email and name columns are the people who replied.
They are not copied into the summary. The facilitator is taken from the
attendance file for those rooms, or from the presenter list when it names
only one person. Otherwise the script asks.
"""

from __future__ import annotations

import html
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import serve  # noqa: E402
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ATTENDANCE_NAME = re.compile(
    r"-(\d{4}-\d{2}-\d{2}-\d{4})-(.+)-([A-Z0-9]{4,8})\.csv$",
    re.IGNORECASE,
)
RANGE_SPLIT = re.compile(r"\s+(?:to|-|–|—)\s+", re.IGNORECASE)
DATE_FORMATS = ("%d/%m/%Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y")
HEADER_FIELDS = {
    "submitted": "submitted",
    "submitted_at": "submitted",
    "room": "room",
    "useful": "useful",
    "comments": "comments",
    "comment": "comments",
    "suggestion": "suggestion",
    "suggestions": "suggestion",
}


def ask(prompt: str) -> str:
    try:
        return input(prompt).strip()
    except EOFError:
        print()
        raise SystemExit("Stopped before the summary was written.")


def parse_date(text: str) -> date:
    raw = " ".join(text.split())
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError("Use a date such as 31/10/2026.")


def parse_range(text: str) -> tuple[date, date]:
    parts = [part for part in RANGE_SPLIT.split(text.strip()) if part.strip()]
    if len(parts) == 1:
        day = parse_date(parts[0])
        return day, day
    if len(parts) == 2:
        start, end = parse_date(parts[0]), parse_date(parts[1])
        if end < start:
            start, end = end, start
        return start, end
    raise ValueError("Enter one date, or a range such as 01/10/2026 to 31/10/2026.")


def ask_range() -> tuple[date, date]:
    print("Date range")
    print("  One day: 31/10/2026")
    print("  Or a range: 01/10/2026 to 31/10/2026")
    while True:
        try:
            return parse_range(ask("> "))
        except ValueError as err:
            print(err)


def ask_sheet() -> str:
    print()
    print("Feedback sheet")
    print("  A file path, or a OneDrive share link")
    while True:
        address = ask("> ").strip().strip('"')
        if address:
            return address
        print("Enter the path or the share link.")


def col_index(letters: str) -> int:
    number = 0
    for ch in letters:
        number = number * 26 + ord(ch.upper()) - 64
    return number


def cell_text(cell: ET.Element, strings: list[str]) -> str:
    kind = cell.get("t")
    value = cell.find("m:v", NS)
    inline = cell.find("m:is", NS)
    if kind == "s" and value is not None and value.text:
        return strings[int(value.text)]
    if inline is not None:
        return "".join(
            node.text or ""
            for node in inline.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
        )
    if value is not None and value.text:
        return value.text
    return ""


def read_xlsx(data: bytes) -> list[dict[str, str]]:
    with zipfile.ZipFile(__import__("io").BytesIO(data)) as book:
        strings: list[str] = []
        if "xl/sharedStrings.xml" in book.namelist():
            root = ET.fromstring(book.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                strings.append(
                    "".join(
                        node.text or ""
                        for node in item.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                    )
                )
        sheet_name = "xl/worksheets/sheet1.xml"
        sheet = ET.fromstring(book.read(sheet_name))
    rows: list[list[str]] = []
    for row in sheet.findall("m:sheetData/m:row", NS):
        values: list[str] = []
        for cell in row.findall("m:c", NS):
            ref = cell.get("r") or "A1"
            letters = re.match(r"[A-Z]+", ref, re.IGNORECASE)
            index = col_index(letters.group(0)) if letters else len(values) + 1
            while len(values) < index - 1:
                values.append("")
            values.append(cell_text(cell, strings))
        rows.append(values)
    if not rows:
        return []
    fields = [HEADER_FIELDS.get(cell.strip().lower(), "") for cell in rows[0]]
    parsed: list[dict[str, str]] = []
    for raw in rows[1:]:
        row = {name: "" for name in ("submitted", "room", "useful", "comments", "suggestion")}
        for index, name in enumerate(fields):
            if name and index < len(raw):
                row[name] = raw[index].strip()
        if any(row.values()):
            parsed.append(row)
    return parsed


def load_sheet(address: str) -> list[dict[str, str]]:
    path = Path(address)
    if not path.is_file():
        path = ROOT / address
    if path.is_file():
        return read_xlsx(path.read_bytes())
    if address.lower().startswith("http"):
        try:
            session = serve.od_connect(address)
            data = serve.feedback_download(session)
        except Exception as err:
            raise SystemExit(
                "Could not open that OneDrive link ({}). Use a share link, or the path to the xlsx.".format(err)
            ) from err
        return read_xlsx(data)
    raise SystemExit("No file at that path: " + address)


def parse_submitted(value: str) -> datetime | None:
    text = value.strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        when = datetime.fromisoformat(text)
    except ValueError:
        when = None
        for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S"):
            try:
                when = datetime.strptime(text, fmt)
                break
            except ValueError:
                continue
        if when is None:
            return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return serve._uk_civil_time(when)


def filter_rows(rows: list[dict[str, str]], start: date, end: date) -> list[dict]:
    chosen = []
    for row in rows:
        when = parse_submitted(row.get("submitted") or "")
        if when is None or when.date() < start or when.date() > end:
            continue
        chosen.append({
            "when": when,
            "room": row.get("room") or "",
            "useful": row.get("useful") or "",
            "comments": row.get("comments") or "",
            "suggestion": row.get("suggestion") or "",
        })
    chosen.sort(key=lambda item: item["when"])
    return chosen


def room_code(label: str) -> str:
    parts = re.findall(r"[A-Z0-9]+", (label or "").upper())
    if len(parts) >= 2:
        return parts[-1]
    return ""


def course_id(label: str) -> str:
    token = (label or "").split()
    if token and token[0].lower() in serve.COURSES:
        return token[0].lower()
    return ""


def attendance_names(codes: set[str]) -> dict[str, str]:
    found: dict[str, tuple[float, str]] = {}
    if not codes:
        return {}
    for root in serve.attendance_search_roots():
        if not root.is_dir():
            continue
        for path in root.glob("*-CPD-attendance-*.csv"):
            match = ATTENDANCE_NAME.search(path.name)
            if not match:
                continue
            code = match.group(3).upper()
            if code not in codes:
                continue
            person = match.group(2).replace("-", " ").strip()
            try:
                stamp = path.stat().st_mtime
            except OSError:
                stamp = 0
            previous = found.get(code)
            if previous is None or stamp >= previous[0]:
                found[code] = (stamp, person)
    return {code: person for code, (_stamp, person) in found.items()}


def configured_presenters() -> list[str]:
    names: list[str] = []
    seen: set[str] = set()
    for name in serve.PRESENTERS.values():
        who = " ".join(str(name).split())
        key = who.casefold()
        if len(who) < 2 or key in seen or key == "course lead":
            continue
        seen.add(key)
        names.append(who)
    return names


def resolve_presenter(rows: list[dict]) -> str:
    codes = {room_code(row["room"]) for row in rows}
    codes.discard("")
    matched = attendance_names(codes)
    from_files = sorted({name for name in matched.values() if name}, key=str.casefold)
    configured = configured_presenters()
    certain = ""
    candidate = ""
    if len(from_files) == 1 and codes and codes <= set(matched):
        certain = from_files[0]
    elif not from_files and len(configured) == 1:
        certain = configured[0]
    elif len(from_files) == 1:
        candidate = from_files[0]
    elif len(configured) == 1:
        candidate = configured[0]
    if certain:
        source = "the attendance file" if from_files else "the presenter list"
        print("Delivered by {} (from {}).".format(certain, source))
        return certain
    if len(from_files) > 1:
        print("Attendance files name more than one facilitator: " + ", ".join(from_files))
    print()
    if candidate:
        typed = ask("Who delivered the session? [{}] ".format(candidate))
        return typed or candidate
    while True:
        typed = ask("Who delivered the session? ")
        if typed:
            return typed
        print("Enter the name of the person who delivered the session.")


def long_date(day: date) -> str:
    return "{} {} {}".format(day.day, day.strftime("%B"), day.year)


def range_label(start: date, end: date) -> str:
    if start == end:
        return long_date(start)
    return "{} to {}".format(long_date(start), long_date(end))


def rating_sentence(rows: list[dict]) -> str:
    count = len(rows)
    noun = "response" if count == 1 else "responses"
    counts = Counter((row["useful"] or "Not rated") for row in rows)
    if len(counts) == 1:
        label = next(iter(counts))
        if label == "Useful":
            return "{} {}. Every one rated the session useful.".format(count, noun)
        return "{} {}. Every one rated the session {}.".format(count, noun, label.lower())
    parts = ["{} {}".format(number, label.lower()) for label, number in counts.most_common()]
    return "{} responses. {}.".format(count, ", ".join(parts))


def suggestion_list(rows: list[dict]) -> list[tuple[str, int]]:
    counts: Counter[str] = Counter()
    for row in rows:
        text = " ".join(row["suggestion"].split())
        if text:
            counts[text] += 1
    return counts.most_common()


def render_html(title: str, when_label: str, presenter: str, rows: list[dict], logo_src: str) -> str:
    suggestions = suggestion_list(rows)
    if len(suggestions) == 1:
        future = html.escape(suggestions[0][0])
    elif suggestions:
        future = str(len(suggestions))
    else:
        future = "None"
    cards = []
    for row in rows:
        comment = html.escape(row["comments"]) if row["comments"] else "No written comment."
        suggestion = ""
        if row["suggestion"]:
            suggestion = "<p><strong>Suggestion:</strong> {}</p>".format(html.escape(row["suggestion"]))
        useful = html.escape(row["useful"]) if row["useful"] else "Not rated"
        cards.append(
            """<div class="card">
      <div class="when">{time} <span class="useful">{useful}</span></div>
      <p>{comment}</p>
      {suggestion}
    </div>""".format(
                time=row["when"].strftime("%H:%M"),
                useful=useful,
                comment=comment,
                suggestion=suggestion,
            )
        )
    if suggestions:
        banners = "\n".join(
            '<div class="banner teal">{}</div>'.format(html.escape(text))
            for text, _count in suggestions
        )
        if len(suggestions) == 1:
            text, number = suggestions[0]
            if len(rows) == 1:
                note = "This response asked for this as a future session."
            elif number == 1:
                note = "One response asked for this as a future session. The others left this blank."
            elif number == len(rows):
                note = "Every response asked for this as a future session."
            else:
                note = "{} responses asked for this as a future session.".format(number)
        else:
            note = "Each suggestion is shown once."
        suggestion_block = banners + "\n    <p>{}</p>".format(html.escape(note))
    else:
        suggestion_block = "<p>No suggestions for a future session.</p>"
    return """<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Session feedback | {title}</title>
  <style>
    :root {{
      --navy: #12382c;
      --ink: #1c2333;
      --muted: #5b6b64;
      --card: #f0e2c4;
      --sheet: #f7f1e4;
      --line: #d4c19a;
      --amber: #d4a017;
      --teal: #1f7a6c;
      --green: #176b45;
      --green-bg: #e7f6ee;
      --stage: #081510;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: var(--ink);
      background: var(--stage);
      line-height: 1.4;
    }}
    .toolbar {{
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: center;
      padding: 10px;
      background: var(--navy);
      color: #f7f4ee;
    }}
    .toolbar button {{
      background: #f0c36a;
      color: var(--navy);
      border: 0;
      padding: 8px 14px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }}
    .sheet {{
      width: min(210mm, calc(100% - 32px));
      margin: 16px auto 32px;
      background: var(--sheet);
      color: var(--ink);
      padding: 14mm 12mm 12mm;
      box-shadow: 0 8px 28px rgba(8, 21, 16, 0.35);
      border-top: 8px solid var(--amber);
    }}
    header {{
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 4px solid var(--navy);
      padding-bottom: 10px;
      margin-bottom: 14px;
    }}
    .kicker {{
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 11px;
      font-weight: 700;
      color: var(--amber);
    }}
    h1 {{
      font-size: 26px;
      line-height: 1.12;
      color: var(--navy);
      letter-spacing: -0.02em;
      margin-top: 4px;
    }}
    h2 {{
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--navy);
      margin: 16px 0 8px;
    }}
    .meta {{ margin-top: 6px; font-size: 13px; color: var(--muted); }}
    .brand-logo {{ height: 54px; width: auto; align-self: center; }}
    .banner {{
      background: var(--navy);
      color: #fff;
      font-weight: 700;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 14px;
    }}
    .banner.teal {{ background: var(--teal); }}
    .stats {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; }}
    .stat {{
      background: var(--card);
      border: 1px solid var(--line);
      padding: 10px 12px;
    }}
    .stat span {{
      display: block;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 700;
    }}
    .stat strong {{ display: block; margin-top: 2px; font-size: 18px; color: var(--navy); }}
    .card {{
      background: #fffdf7;
      border: 1px solid var(--line);
      padding: 10px 12px;
      margin-top: 8px;
    }}
    .when {{
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--teal);
    }}
    .useful {{
      display: inline-block;
      margin-left: 8px;
      background: var(--green-bg);
      color: var(--green);
      font-size: 12px;
      font-weight: 700;
      padding: 1px 8px;
      letter-spacing: 0;
      text-transform: none;
    }}
    p {{ font-size: 14px; margin-top: 6px; }}
    .foot {{
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      font-size: 11px;
      color: var(--muted);
    }}
    @media print {{
      body {{ background: #fff; }}
      .toolbar {{ display: none; }}
      .sheet {{ width: auto; margin: 0; padding: 0; box-shadow: none; }}
    }}
    @page {{ size: A4; margin: 12mm; }}
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Print / save PDF</button>
  </div>
  <article class="sheet">
    <header>
      <div>
        <p class="kicker">Ambulance clinical refreshers</p>
        <h1>Session feedback</h1>
        <p>{title}</p>
        <p class="meta">{when} · Delivered by {presenter}</p>
      </div>
      <img class="brand-logo" src="{logo}" alt="Hub CPD. Ambulance clinical refreshers.">
    </header>
    <div class="banner">{banner}</div>
    <div class="stats">
      <div class="stat"><span>Responses</span><strong>{count}</strong></div>
      <div class="stat"><span>Useful</span><strong>{useful}</strong></div>
      <div class="stat"><span>Future topic</span><strong>{future}</strong></div>
    </div>
    <h2>Comments</h2>
    {cards}
    <h2>Suggestions for a future session</h2>
    {suggestions}
    <p class="foot">Times are UK time. Room, email and name of the people who replied are not included.</p>
  </article>
</body>
</html>
""".format(
        title=html.escape(title),
        when=html.escape(when_label),
        presenter=html.escape(presenter),
        logo=html.escape(logo_src, quote=True),
        banner=html.escape(rating_sentence(rows)),
        count=len(rows),
        useful=sum(1 for row in rows if row["useful"] == "Useful"),
        future=future,
        cards="\n    ".join(cards),
        suggestions=suggestion_block,
    )


def course_title(course: str) -> str:
    record = serve.COURSES.get(course) or {}
    return str(record.get("home_heading") or record.get("title") or "Hub CPD")


def write_summary(course: str, start: date, end: date, presenter: str, rows: list[dict]) -> Path:
    folder = ROOT / (course or "feedback-summaries") / "feedback"
    if course == "":
        folder = ROOT / "feedback-summaries"
    folder.mkdir(parents=True, exist_ok=True)
    label = range_label(start, end)
    title = course_title(course) if course else "Hub CPD"
    short = course.upper() if course else "Hub CPD"
    path = folder / "{} session feedback {}.html".format(short, label)
    logo = ROOT / "assets" / "hub-cpd-logo.png"
    logo_src = Path(os_relpath(logo, path.parent)).as_posix() if logo.is_file() else ""
    path.write_text(render_html(title, label, presenter, rows, logo_src), encoding="utf-8")
    return path


def os_relpath(path: Path, start: Path) -> str:
    return Path(__import__("os").path.relpath(path, start)).as_posix()


def main() -> None:
    print("Hub CPD feedback summary")
    print()
    start, end = ask_range()
    address = ask_sheet()
    rows = filter_rows(load_sheet(address), start, end)
    if not rows:
        print()
        print("No responses in that date range.")
        return
    presenter = resolve_presenter(rows)
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[course_id(row["room"])].append(row)
    print()
    for course, group in grouped.items():
        path = write_summary(course, start, end, presenter, group)
        print("Wrote {}".format(path))


if __name__ == "__main__":
    main()
