"""Create the starter files for a new Hub CPD topic.

From this project folder:

    python new_topic.py

The topic stays off the public home page. Restart the editor and
python serve.py after it finishes.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

import qrcodegen

ROOT = Path(__file__).resolve().parent
HEADERS = ["Submitted", "Room", "Useful", "Comments", "Email", "Suggestion", "Name"]
FOLDER_RULE = re.compile(r"[A-Za-z0-9][A-Za-z0-9 _.-]{0,80}\Z")
ID_RULE = re.compile(r"[a-z][a-z0-9]{0,20}\Z")


def ask(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(label + suffix + ": ").strip()
    return value or default


def suggest_id(heading: str) -> str:
    word = re.sub(r"[^a-z0-9]", "", heading.lower().split()[0] if heading.split() else "")
    return word[:20]


def js(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def plain(value: str) -> str:
    return html.escape(value).replace("`", "&#96;").replace("${", "&#36;{")


def qr_svg(text: str) -> str:
    code = qrcodegen.QrCode.encode_text(text, qrcodegen.QrCode.Ecc.MEDIUM)
    border = 2
    modules = code.get_size()
    side = (modules + border * 2) * 8
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}" width="{side}" height="{side}">',
        '<rect width="100%" height="100%" fill="#fff"/>',
    ]
    for y in range(modules):
        for x in range(modules):
            if code.get_module(x, y):
                parts.append(
                    f'<rect x="{(x + border) * 8}" y="{(y + border) * 8}" width="8" height="8"/>'
                )
    parts.append("</svg>")
    return "".join(parts)


def feedback_workbook() -> bytes:
    import serve
    return serve.build_xlsx([HEADERS])


def slides_js(topic: dict) -> str:
    title = plain(topic["heading"])
    points = [plain(line) for line in topic["points"]]
    qr = f'{topic["id"]}/assets/{topic["id"]}-certificate-qr.svg'
    return f"""function {topic["id"]}Slides() {{
  return [
    {{
      type: "title",
      kicker: "Ambulance Clinical Refreshers",
      title: {js(topic["heading"])},
      subtitle: {js(topic["blurb"])},
      meta: "Always follow the live JRCALC entry and local Trust policy.",
      notes: "Title only for now. The teaching slides come next."
    }},
    {{
      kicker: "Core messages",
      title: "Learning objectives",
      html: `
        <div class="card"><h3>By the end you will have refreshed how to:</h3><ul></ul></div>
        <div class="body two">
          <div class="card"><h3></h3><p></p></div>
          <div class="card"><h3></h3><p></p></div>
        </div>`,
      notes: "Leave this blank until the objectives are agreed."
    }},
    {{
      kicker: "Take home",
      title: "Take home points",
      html: `
        <div class="body">
          <div class="banner build hold-space">{points[0]}</div>
          <div class="banner teal build hold-space" style="margin-top:8px">{points[1]}</div>
          <div class="banner green build hold-space" style="margin-top:8px">{points[2]}</div>
        </div>`,
      notes: "Replace these three lines with the points the room should leave with."
    }},
    {{
      kicker: "Sources",
      title: "References",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Clinical guidance</h3>
            <ul><li>JRCALC {title} — add the live entry</li></ul>
          </div>
          <div class="card">
            <h3>Local guidance</h3>
            <ul><li>Add Trust notices</li></ul>
          </div>
        </div>`,
      notes: "Add the guideline links before this session is used."
    }},
    {{
      questions: true,
      self: false,
      kicker: "Close",
      title: "Any questions?",
      html: `
        <div class="body">
          <div class="banner dark">Thank you for attending</div>
          <div class="banner teal" style="margin-top:12px">We hope it has been useful</div>
          <div class="banner" style="margin-top:12px">Ask now, or email: <a href="mailto:info@hub-cpd.co.uk" style="color:inherit;text-decoration:underline">info@hub-cpd.co.uk</a></div>
          <div class="banner green" style="margin-top:12px">The next slide is for feedback, and ideas for another 30-minute CPD.</div>
        </div>`,
      notes: "Live room only. Leave this up for questions."
    }},
    {{
      feedback: true,
      kicker: "Feedback",
      title: "Help shape the next session",
      html: `
        <div class="body two feedback-layout">
          <div>
            <div class="banner teal">Please provide feedback on this session</div>
            <div class="banner" style="margin-top:12px">Any suggestions for a future session?</div>
          </div>
          <aside class="poll-join feedback-join">
            <img class="feedback-qr" alt="Open the feedback form" width="132" height="132" hidden />
            <p class="poll-url"></p>
          </aside>
        </div>
        <div class="feedback-brand">
          <img class="feedback-logo" src="assets/hub-cpd-logo.png" alt="Hub CPD. Ambulance clinical refreshers.">
          <p class="feedback-home"></p>
        </div>`,
      notes: "The feedback QR is filled in a live room."
    }},
    {{
      hostedOnly: true,
      self: false,
      kicker: "",
      title: "Record attendance for a CPD certificate",
      html: `
        <div class="body trust-attend has-guide">
          <div class="trust-qr">
            <img src="{qr}" alt="Placeholder CPD certificate QR code" />
          </div>
        </div>`,
      notes: "Live room only. This QR is a placeholder. Replace it before the session is used."
    }}
  ];
}}
"""


def editor_deck(topic: dict) -> dict:
    course = topic["id"]
    return {
        "kind": "hub-cpd-deck",
        "version": 1,
        "course": course,
        "title": topic["heading"],
        "updated": "2026-10-31T10:00:00Z",
        "updatedBy": "this computer",
        "slides": [
            {
                "id": course + "-title",
                "template": "title",
                "live": True,
                "self": True,
                "notes": "Title only for now. The teaching slides come next.",
                "kicker": "Ambulance Clinical Refreshers",
                "title": topic["heading"],
                "subtitle": topic["blurb"],
                "meta": "Always follow the live JRCALC entry and local Trust policy.",
            },
            {
                "id": course + "-aims",
                "template": "aims",
                "live": True,
                "self": True,
                "notes": "Leave this blank until the objectives are agreed.",
                "kicker": "Core messages",
                "title": "Learning objectives",
                "leadTitle": "By the end you will have refreshed how to:",
                "leadBody": "",
                "leftTitle": "",
                "leftBody": "",
                "leftNote": "",
                "rightTitle": "",
                "rightBody": "",
                "rightNote": "",
                "banner1": "",
                "banner2": "",
                "callout": "",
            },
            {
                "id": course + "-take-home",
                "template": "banners",
                "live": True,
                "self": True,
                "notes": "Replace these three lines with the points the room should leave with.",
                "kicker": "Take home",
                "title": "Take home points",
                "lines": "\n".join([
                    topic["points"][0],
                    "teal | " + topic["points"][1],
                    "green | " + topic["points"][2],
                ]),
                "reveal": True,
            },
            {
                "id": course + "-references",
                "template": "columns",
                "live": True,
                "self": True,
                "notes": "Add the guideline links before this session is used.",
                "kicker": "Sources",
                "title": "References",
                "leftTitle": "Clinical guidance",
                "leftBody": "JRCALC " + topic["heading"] + " — add the live entry",
                "leftProse": False,
                "rightTitle": "Local guidance",
                "rightBody": "Add Trust notices",
                "rightProse": False,
                "rightTone": "normal",
            },
            {
                "id": course + "-questions",
                "template": "banners",
                "live": True,
                "self": False,
                "questions": True,
                "notes": "Live room only. Leave this up for questions.",
                "kicker": "Close",
                "title": "Any questions?",
                "lines": "\n".join([
                    "navy | Thank you for attending",
                    "teal | We hope it has been useful",
                    "Ask now, or email info@hub-cpd.co.uk",
                    "green | The next slide is for feedback, and ideas for another 30-minute CPD.",
                ]),
                "reveal": False,
            },
            {
                "id": course + "-feedback",
                "template": "feedback",
                "live": True,
                "self": True,
                "feedback": True,
                "notes": "The feedback QR is filled in a live room.",
                "kicker": "Feedback",
                "title": "Help shape the next session",
                "line1": "Please provide feedback on this session",
                "line2": "Any suggestions for a future session?",
            },
            {
                "id": course + "-certificate",
                "template": "certificate",
                "live": True,
                "self": False,
                "hostedOnly": True,
                "notes": "Live room only. This QR is a placeholder. Replace it before the session is used.",
                "kicker": "",
                "title": "Record attendance for a CPD certificate",
                "image": f'{course}/assets/{course}-certificate-qr.svg',
                "guide": "",
            },
        ],
    }


def insert_before(path: Path, marker: str, addition: str) -> None:
    text = path.read_text(encoding="utf-8")
    if addition.strip() in text:
        return
    found = text.find(marker)
    if found < 0:
        raise SystemExit(f"Could not update {path.name}")
    path.write_text(text[:found] + addition + text[found:], encoding="utf-8")


def register_course(topic: dict) -> None:
    course = topic["id"]
    serve = ROOT / "serve.py"
    text = serve.read_text(encoding="utf-8")
    if f'"{course}":' in text.split("_DRAFT_HITS", 1)[0]:
        raise SystemExit(f"{course} is already a topic")
    block = (
        f'    "{course}": {{\n'
        f'        "id": "{course}",\n'
        f'        "title": {json.dumps(topic["heading"], ensure_ascii=False)},\n'
        f'        "detail": {json.dumps("JRCALC " + topic["heading"] + " · 30 minutes", ensure_ascii=False)},\n'
        f'        "prefix": "{course.upper()}-CPD-attendance-",\n'
        f'        "folder": {json.dumps(topic["folder"], ensure_ascii=False)},\n'
        f'        "published": False,\n'
        f'        "home_tag": {json.dumps(topic["tag"], ensure_ascii=False)},\n'
        f'        "home_heading": {json.dumps(topic["heading"], ensure_ascii=False)},\n'
        f'        "home_blurb": {json.dumps(topic["blurb"], ensure_ascii=False)},\n'
        f'        "home_class": "",\n'
        f'    }},\n'
    )
    insert_before(serve, "\n}\n_DRAFT_HITS", block)

    editor = ROOT / "editor.py"
    editor_text = editor.read_text(encoding="utf-8")
    start = editor_text.index("COURSE_FILES = {")
    end = editor_text.index("\n}", start)
    line = f'    "{course}": ("{course}DeckSlides", ROOT / "{course}" / "deck.js", ROOT / "{course}" / "slides.js"),'
    if line not in editor_text:
        editor.write_text(editor_text[:end] + "\n" + line + editor_text[end:], encoding="utf-8")

    page = ROOT / "index.html"
    page_text = page.read_text(encoding="utf-8")
    scripts = (
        f'  <script src="{course}/deck.js"></script>\n'
        f'  <script src="{course}/slides.js?v=start1"></script>\n'
    )
    if f"{course}/slides.js" not in page_text:
        page_text = page_text.replace('  <script id="hubPublished"', scripts + '  <script id="hubPublished"', 1)
    match = re.search(
        r'(<script id="hubPublished" type="application/json">)(\{.*?\})(</script>)',
        page_text,
    )
    if not match:
        raise SystemExit("Could not update the published list in index.html")
    published = json.loads(match.group(2))
    published[course] = False
    page_text = page_text[: match.start(2)] + json.dumps(published, separators=(",", ":")) + page_text[match.end(2) :]
    catalog = (
        f'      {course}: {{\n'
        f'        id: "{course}",\n'
        f'        title: {js(topic["heading"])},\n'
        f'        short: {js(topic["heading"] + " CPD")},\n'
        f'        footer: {js("Hub CPD · JRCALC " + topic["heading"])},\n'
        f'        handout: "{course}/handout.html",\n'
        f'        store: "{course}-cpd-state",\n'
        f'        selfStore: "{course}-cpd-self-state",\n'
        f'        channel: "{course}-cpd-deck",\n'
        f'        attendKey: "{course}-cpd-register",\n'
        f'        published: hubPublished("{course}", false)\n'
        f'      }},\n'
    )
    cursor = page_text.find('    const courseKey = String(params.get("course")')
    brace = page_text.rfind("    };", 0, cursor)
    if cursor < 0 or brace < 0 or catalog.strip() in page_text:
        if catalog.strip() not in page_text:
            raise SystemExit("Could not update the course list in index.html")
    else:
        page_text = page_text[:brace] + catalog + page_text[brace:]
    page.write_text(page_text, encoding="utf-8")

    example = ROOT / ".env.example"
    example_text = example.read_text(encoding="utf-8") if example.is_file() else ""
    key = re.sub(r"[^A-Za-z0-9]", "", course).upper()
    extra = ""
    for suffix in ("DEV", "LIVE"):
        name = f"FEEDBACK_SHARE_{key}_{suffix}="
        if name not in example_text:
            extra += name + "\n"
    if extra:
        example.write_text(example_text.rstrip() + "\n" + extra, encoding="utf-8")

    future = ROOT / "FUTURE-TOPICS.md"
    future_text = future.read_text(encoding="utf-8")
    if f"**{topic['heading']}.**" not in future_text:
        start = future_text.index("## In progress")
        nxt = future_text.index("\n## ", start + 1)
        section = future_text[start:nxt]
        number = len(re.findall(r"(?m)^\d+\. ", section)) + 1
        item = (
            f"{number}. **{topic['heading']}.** Unpublished and off the public home page. "
            f"Starter slides are in the editor. {topic['blurb']}\n\n"
        )
        future.write_text(future_text[:nxt] + item + future_text[nxt:].lstrip("\n"), encoding="utf-8")


def create_topic(topic: dict) -> None:
    course = topic["id"]
    code = ROOT / course
    if code.exists():
        raise SystemExit(f"The folder {course} already exists")
    register_course(topic)
    code.mkdir()
    (code / "assets").mkdir()
    (code / "feedback").mkdir()
    (code / "deck.js").write_text(
        "/* No editor draft has been copied into this project yet.\n"
        "   The player uses slides.js until the editor copies a deck here. */\n",
        encoding="utf-8",
    )
    (code / "slides.js").write_text(slides_js(topic), encoding="utf-8")
    (code / "handout.html").write_text(
        "<!DOCTYPE html>\n<html lang=\"en-GB\">\n<head>\n"
        '  <meta charset="UTF-8" />\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
        f"  <title>{html.escape(topic['heading'])} CPD handout | Hub CPD</title>\n"
        "</head>\n<body>\n"
        f"  <h1>{html.escape(topic['heading'])}</h1>\n"
        "  <p>This handout will be written with the session. Always follow the live JRCALC entry and local Trust policy.</p>\n"
        "</body>\n</html>\n",
        encoding="utf-8",
    )
    qr_text = f"Hub CPD placeholder. Replace this QR before the {topic['heading']} session."
    (code / "assets" / f"{course}-certificate-qr.svg").write_text(qr_svg(qr_text), encoding="utf-8")
    book = feedback_workbook()
    (code / "feedback" / "dev.xlsx").write_bytes(book)
    (code / "feedback" / "live.xlsx").write_bytes(book)
    draft = ROOT / "editor-drafts" / topic["folder"]
    draft.mkdir(parents=True, exist_ok=True)
    (draft / "deck.json").write_text(
        json.dumps(editor_deck(topic), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def questions() -> dict:
    heading = ask("Topic name, as it should appear on the title slide")
    if not heading:
        raise SystemExit("A topic needs a name")
    course = ask("Short id, letters and numbers only", suggest_id(heading)).lower()
    if not ID_RULE.fullmatch(course):
        raise SystemExit("Use a short id such as glycaemic. Start with a letter. No spaces.")
    folder_default = heading if FOLDER_RULE.fullmatch(heading) else course
    folder = ask("Editor folder name", folder_default)
    if not FOLDER_RULE.fullmatch(folder):
        raise SystemExit("The folder name cannot contain a slash. Use letters, numbers, spaces, or a hyphen.")
    tag = ask("Home-page tag, such as Respiratory, Cardiac, or Neurology", "Clinical")
    blurb = ask("One line about this session")
    if not blurb:
        blurb = "Add the one-line description for the home page."
    points = []
    for number in (1, 2, 3):
        points.append(ask(f"Take-home point {number}", f"Add take-home point {number}"))
    return {
        "heading": heading,
        "id": course,
        "folder": folder,
        "tag": tag,
        "blurb": blurb,
        "points": points,
    }


def self_test() -> None:
    svg = qr_svg("Hub CPD placeholder")
    assert svg.startswith("<svg") and svg.endswith("</svg>")
    import serve
    book = feedback_workbook()
    rows = serve.workbook_rows(book)
    assert rows[0] == HEADERS
    added = serve.xlsx_append(book, ["now", "room", "yes", "note", "a@b.c", "idea", "Pat"])
    assert serve.workbook_rows(added)[1][0] == "now"
    assert "## In progress" in (ROOT / "FUTURE-TOPICS.md").read_text(encoding="utf-8")
    page = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'const courseKey = String(params.get("course")' in page
    assert (ROOT / "serve.py").read_text(encoding="utf-8").find("\n}\n_DRAFT_HITS") > 0
    print("new topic check ok")


def main() -> None:
    import sys
    if "--self-test" in sys.argv:
        self_test()
        return
    topic = questions()
    create_topic(topic)
    key = re.sub(r"[^A-Za-z0-9]", "", topic["id"]).upper()
    print()
    print(f"Created {topic['heading']} ({topic['id']}). It is not on the public home page.")
    print("Restart python serve.py and the editor, then open the topic there.")
    print(f"Paste the OneDrive workbook links into .env as FEEDBACK_SHARE_{key}_DEV and FEEDBACK_SHARE_{key}_LIVE.")
    print("Replace the holding certificate QR before the session is used.")


if __name__ == "__main__":
    main()
