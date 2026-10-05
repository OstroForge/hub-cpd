#!/usr/bin/env python3
"""Serve Hub CPD decks with a live room quiz.

Same questions every session. No Slido account.

    python serve.py

Room:      press S, fullscreen the Audience window on the projector.
Teams:     share that same Audience window (Share window, not the presenter screen).
           Copy the join link into chat so remote staff can vote.

Phones in the room scan the QR. If Trust Wi-Fi blocks laptop access, use a hotspot
or a public URL (cloudflared / Render) and set PUBLIC_URL to that origin.

    set PUBLIC_URL=https://your-public-host
    python serve.py
"""
from __future__ import annotations

import base64
import csv
import io
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from xml.sax.saxutils import escape
from functools import partial
from http.cookiejar import CookieJar
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from qrcodegen import QrCode

ROOT = Path(__file__).resolve().parent
PORT = 8765


def unquote_env(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def debug_flag(raw: str | None) -> bool | None:
    if raw is None:
        return None
    text = raw.strip().lower()
    if text in ("1", "true", "yes", "on"):
        return True
    if text in ("0", "false", "no", "off"):
        return False
    return None


def _env_lookup(file_values: dict[str, str]) -> dict[str, str]:
    """Process environment wins over the gitignored .env file."""
    source: dict[str, str] = {}
    for key in ("DEBUG", "ATTEND_ENV", "ATTEND_SHARE_URL", "RENDER"):
        if key in os.environ:
            source[key] = os.environ[key]
        elif key in file_values:
            source[key] = file_values[key]
    return source


def sheet_env_from(source: dict[str, str]) -> str:
    """dev or live. DEBUG=true uses the dev workbooks. DEBUG=false uses the live ones."""
    flag = debug_flag(source.get("DEBUG"))
    if flag is True:
        return "dev"
    if flag is False:
        return "live"
    forced = (source.get("ATTEND_ENV") or "").strip().lower()
    if forced in ("dev", "live"):
        return forced
    if (source.get("ATTEND_SHARE_URL") or "").strip() or source.get("RENDER"):
        return "live"
    return "dev"


def presenter_piece(value: str) -> str:
    """One person in the same shape as Render's PRESENTERS value."""
    text = value.strip()
    if ":" not in text:
        return text
    pin, name = text.split(":", 1)
    pin = pin.strip()
    name = " ".join(name.split())
    return "{}: {}".format(pin, name) if name else pin


def load_local_env(path: Path) -> None:
    """Fill os.environ from the gitignored .env file. Real environment variables win."""
    if not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8-sig").splitlines()
    except OSError:
        return
    shared: list[str] = []
    by_env: dict[str, list[str]] = {"dev": [], "live": []}
    file_values: dict[str, str] = {}
    for line in lines:
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        key = key.strip()
        value = unquote_env(value)
        if not key:
            continue
        if key == "INSTRUCTOR":
            if value:
                shared.append(value)
            continue
        if key in ("INSTRUCTOR_DEV", "INSTRUCTOR_LIVE"):
            if value:
                by_env[key.rsplit("_", 1)[-1].lower()].append(value)
            continue
        file_values.setdefault(key, value)
    chosen = sheet_env_from(_env_lookup(file_values))
    extras = shared + by_env.get(chosen, [])
    if extras:
        parts = []
        base = file_values.get("PRESENTERS", "").strip()
        if base:
            parts.append(base)
        parts.extend(presenter_piece(item) for item in extras)
        file_values["PRESENTERS"] = "; ".join(parts)
    for key, value in file_values.items():
        if key not in os.environ:
            os.environ[key] = value


load_local_env(ROOT / ".env")

HOST_TOKEN = os.environ.get("HOST_TOKEN") or secrets.token_urlsafe(8)
PIN_FILE = ROOT / "presenter-pin.txt"
PRESENTERS_FILE = ROOT / "presenters.txt"
PUBLIC_URL = (os.environ.get("PUBLIC_URL") or "").rstrip("/")
LOCK = threading.Lock()
ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
ROOMS: dict[str, "Room"] = {}
CERT_FILE = ROOT / "certificates.csv"
CERT_WEBHOOK = (os.environ.get("CERT_WEBHOOK") or "").strip()
ATTEND_CONFIG = ROOT / "attend-folder.txt"
OD_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
)
_OD: dict = {}
FEEDBACK_FILE = ROOT / "feedback.csv"
FEEDBACK_LOCK = threading.Lock()
_FEEDBACK_SESSIONS: dict[str, dict] = {}
_FEEDBACK_HITS: dict[str, list[float]] = {}
FEEDBACK_HEADERS = ["Submitted", "Room", "Useful", "Comments", "Email", "Suggestion", "Name"]
_SHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_EMAIL_RE = re.compile(
    r"^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?"
    r"@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*"
    r"\.[A-Za-z]{2,}$"
)
COURSES = {
    "copd": {
        "id": "copd",
        "title": "COPD, Type 2 Respiratory Failure and NEWS2",
        "detail": "JRCALC Chronic Obstructive Pulmonary Disease · 30 minutes",
        "prefix": "COPD-CPD-attendance-",
        "folder": "copd",
    },
    "hf": {
        "id": "hf",
        "title": "Heart Failure in Pre-hospital Care",
        "detail": "JRCALC Heart Failure · 30 minutes",
        "prefix": "HF-CPD-attendance-",
        "folder": "heart failure",
    },
}


def course_record(course_id: str) -> dict:
    return COURSES.get(course_id) or COURSES["copd"]


def course_folder_name(course_id: str) -> str:
    rec = course_record(course_id)
    raw = str(rec.get("folder") or rec["id"])
    text = re.sub(r"[\\/]+", " ", raw).strip()
    text = re.sub(r"[^\w\s.-]", "", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip(" .")
    return (text[:80] or rec["id"])


def _usable_lan_ip(ip: str) -> bool:
    if not ip or ip.startswith("127.") or ip.startswith("169.254."):
        return False
    return True


def lan_ips() -> list[str]:
    found: list[str] = []
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        if _usable_lan_ip(ip):
            found.append(ip)
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if _usable_lan_ip(ip) and ip not in found:
                found.append(ip)
    except OSError:
        pass
    return found


def is_loopback(handler: SimpleHTTPRequestHandler) -> bool:
    host = handler.client_address[0]
    return host in ("127.0.0.1", "::1", "::ffff:127.0.0.1")


def host_is_local(host: str) -> bool:
    name = (host or "").split(":")[0].strip().lower()
    return name in ("", "localhost", "127.0.0.1", "::1")


HUB_ORIGIN = "https://hub-cpd.onrender.com"
LEGACY_HOSTS = {"copd-cpd.onrender.com"}


def request_host_name(handler: SimpleHTTPRequestHandler) -> str:
    return (handler.headers.get("Host") or "").split(":")[0].strip().lower()


def redirect_legacy_host(handler: SimpleHTTPRequestHandler) -> bool:
    host = request_host_name(handler)
    if host not in LEGACY_HOSTS:
        return False
    path = handler.path or "/"
    if path.split("?", 1)[0] == "/healthz":
        return False
    handler.send_response(308)
    handler.send_header("Location", HUB_ORIGIN + path)
    handler.send_header("Cache-Control", "public, max-age=3600")
    handler.end_headers()
    return True


def request_base(handler: SimpleHTTPRequestHandler) -> str:
    if PUBLIC_URL:
        return PUBLIC_URL
    host = handler.headers.get("Host") or f"127.0.0.1:{PORT}"
    if host_is_local(host):
        ips = lan_ips()
        if ips:
            return f"http://{ips[0]}:{PORT}"
        return f"http://127.0.0.1:{PORT}"
    forwarded = (handler.headers.get("X-Forwarded-Proto") or "").split(",")[0].strip()
    proto = forwarded or ("https" if host.endswith(":443") else "http")
    return f"{proto}://{host}"


def join_url(handler: SimpleHTTPRequestHandler, room_id: str = "", course_id: str = "") -> str:
    url = request_base(handler) + "/v"
    parts = []
    if room_id:
        parts.append("r=" + room_id)
    if course_id in COURSES:
        parts.append("course=" + course_id)
    if parts:
        url += "?" + "&".join(parts)
    return url


def requested_join(handler: SimpleHTTPRequestHandler) -> str:
    parsed = urlparse(handler.path)
    raw = (parse_qs(parsed.query).get("u") or [""])[0].strip()
    if not raw:
        return join_url(handler)
    if not (raw.startswith("http://") or raw.startswith("https://")) or len(raw) > 300:
        return join_url(handler)
    return raw


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clean_name(raw: object) -> str:
    text = " ".join(str(raw or "").split())
    return text[:80]


def clean_esr(raw: object) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(raw or "").upper())[:16]


def clean_email(raw: object) -> str:
    text = " ".join(str(raw or "").split()).lower()[:120]
    if not re.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", text):
        return ""
    return text


def pin_key(raw: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (raw or "").upper())


def load_presenters() -> dict[str, str]:
    found: dict[str, str] = {}

    def add(pin: str, name: str) -> None:
        key = pin_key(pin)
        who = clean_name(name)
        if len(key) >= 4 and key not in found:
            found[key] = who

    env_list = (os.environ.get("PRESENTERS") or "").strip().strip('"')
    if env_list:
        for part in env_list.split(";"):
            part = part.strip()
            if not part:
                continue
            if ":" in part:
                pin, name = part.split(":", 1)
                add(pin, name)
            else:
                add(part, "")
    env_pin = (os.environ.get("PRESENTER_PIN") or "").strip().strip('"')
    if env_pin:
        add(env_pin, os.environ.get("PRESENTER_NAME") or "")
    if not found:
        for path in (PIN_FILE, PRESENTERS_FILE):
            if not path.exists():
                continue
            try:
                lines = path.read_text(encoding="utf-8").splitlines()
            except OSError:
                continue
            for line in lines:
                raw = line.strip().strip('"')
                if not raw or raw.startswith("#"):
                    continue
                bits = raw.replace("\t", " ").split(None, 1)
                add(bits[0], bits[1] if len(bits) > 1 else "")
    if found:
        return found
    pin = "".join(secrets.choice(ROOM_ALPHABET) for _ in range(6))
    add(pin, "Course lead")
    line = 'PRESENTERS="{}: Course lead"\n'.format(pin)
    env_path = ROOT / ".env"
    try:
        if env_path.exists():
            current = env_path.read_text(encoding="utf-8")
            if current and not current.endswith("\n"):
                current += "\n"
            env_path.write_text(current + line, encoding="utf-8")
        else:
            env_path.write_text(
                "# Local secrets. Gitignored.\n" + line,
                encoding="utf-8",
            )
    except OSError:
        try:
            PRESENTERS_FILE.write_text(
                "# PIN  Full name as it should appear on the attendance file\n"
                "# Prefer .env — PRESENTERS=\"PIN: Full Name; PIN: Full Name\"\n"
                + pin
                + "  Course lead\n",
                encoding="utf-8",
            )
        except OSError:
            pass
    return found


PRESENTERS = load_presenters()


def request_host_secret(handler: SimpleHTTPRequestHandler) -> str:
    parsed = urlparse(handler.path)
    query = (parse_qs(parsed.query).get("host") or [""])[0]
    return (handler.headers.get("X-Host-Token") or query or "").strip()


def presenter_for_token(token: str) -> str:
    return PRESENTERS.get(pin_key(token), "")


def secret_is_host(token: str) -> bool:
    if not token:
        return False
    if token == HOST_TOKEN:
        return True
    return pin_key(token) in PRESENTERS


def blank_poll() -> dict:
    return {
        "id": None,
        "kind": "choice",
        "prompt": "",
        "options": [],
        "obs": {},
        "correct": None,
        "expectedTotal": None,
        "expectedScale": None,
        "teach": "",
        "open": False,
        "revealed": False,
        "votes": {},
    }


class Room:
    def __init__(self, rid: str) -> None:
        self.id = rid
        self.poll = blank_poll()
        self.history: dict = {}
        self.names: dict = {}
        self.register_open = False
        self.feedback_open = False
        self.session_file: Path | None = None
        self.session_name = ""
        self.session_cloud = False
        self.session_url = ""
        self.bound = False
        self.course_id = "copd"
        self.touched = time.monotonic()

    def cert_path(self) -> Path:
        return ROOT / ("certificates-{}.csv".format(self.id.lower()))


def new_room_id() -> str:
    for _ in range(20):
        rid = "".join(secrets.choice(ROOM_ALPHABET) for _ in range(6))
        if rid not in ROOMS:
            return rid
    return secrets.token_urlsafe(6).upper()[:8]


def request_course_id(handler: SimpleHTTPRequestHandler) -> str:
    parsed = urlparse(handler.path)
    course = (parse_qs(parsed.query).get("course") or [""])[0].strip().casefold()
    if not course:
        course = (handler.headers.get("X-Course") or "").strip().casefold()
    return course if course in COURSES else ""


def request_room_id(handler: SimpleHTTPRequestHandler) -> str:
    parsed = urlparse(handler.path)
    rid = (parse_qs(parsed.query).get("r") or [""])[0].strip().upper()
    if not rid:
        rid = (handler.headers.get("X-Room") or "").strip().upper()
    return re.sub(r"[^A-Z0-9]", "", rid)[:8]


def get_room(rid: str, create: bool = False) -> Room | None:
    if rid and rid in ROOMS:
        room = ROOMS[rid]
        room.touched = time.monotonic()
        attach_session(room)
        return room
    if not create:
        return None
    if rid and re.fullmatch(r"[A-Z0-9]{4,8}", rid):
        room = Room(rid)
        ROOMS[rid] = room
        attach_session(room)
        return room
    fresh = new_room_id()
    room = Room(fresh)
    ROOMS[fresh] = room
    attach_session(room)
    return room


def load_names() -> None:
    return


def extra_cert_paths() -> list[Path]:
    paths = [ROOT / "COPD-CPD-certificate-names.csv"]
    home = Path.home()
    for folder in (home / "Documents", home / "OneDrive"):
        if folder.exists():
            paths.append(folder / "COPD-CPD-certificate-names.csv")
    unique = []
    seen = set()
    for path in paths:
        key = str(path.resolve()) if path.parent.exists() else str(path)
        if key not in seen:
            seen.add(key)
            unique.append(path)
    return unique


def attend_file_sections(lines: list[str]) -> dict[str, dict[str, str]]:
    sections: dict[str, dict[str, str]] = {
        "dev": {"share": "", "folder": ""},
        "live": {"share": "", "folder": ""},
        "any": {"share": "", "folder": ""},
    }
    current = "any"
    for line in lines:
        raw = line.strip().strip('"')
        if not raw:
            continue
        if raw.startswith("#"):
            label = raw[1:].strip().upper()
            if "DEV" in label:
                current = "dev"
            elif "LIVE" in label or "PROD" in label:
                current = "live"
            continue
        lower = raw.lower()
        slot = sections[current]
        if lower.startswith("http://") or lower.startswith("https://"):
            if not slot["share"]:
                slot["share"] = raw
        elif not slot["folder"]:
            slot["folder"] = raw
    return sections


def feedback_share_url(course_id: str = "copd") -> str:
    """OneDrive workbook for a topic in the current environment.

    .env keeps both addresses: FEEDBACK_SHARE_<COURSE>_DEV and _LIVE.
    """
    course = re.sub(r"[^A-Za-z0-9]", "", (course_id or "copd")).upper() or "COPD"
    env_name = attend_env().upper()
    for key in ("FEEDBACK_SHARE_" + course + "_" + env_name, "FEEDBACK_SHARE_" + course):
        specific = (os.environ.get(key) or "").strip().strip('"')
        if specific:
            return specific
    if course == "COPD":
        url = (os.environ.get("FEEDBACK_SHARE_URL") or "").strip().strip('"')
        if url:
            return url
        legacy = ROOT / "feedback-share.txt"
        if legacy.is_file():
            try:
                return legacy.read_text(encoding="utf-8").strip().strip('"')
            except OSError:
                return ""
    return ""


def feedback_workbook_url(course_id: str = "copd") -> str:
    """That course's own workbook. COPD and Heart Failure never share a sheet."""
    course = (course_id or "copd").strip().casefold()
    if course not in COURSES:
        course = "copd"
    return feedback_share_url(course)


def clean_feedback_text(raw: object, limit: int) -> str:
    return " ".join(str(raw or "").split())[:limit]


def feedback_allowed(ip: str) -> bool:
    now = time.monotonic()
    hits = [stamp for stamp in _FEEDBACK_HITS.get(ip, []) if now - stamp < 3600]
    if len(hits) >= 30:
        _FEEDBACK_HITS[ip] = hits
        return False
    hits.append(now)
    _FEEDBACK_HITS[ip] = hits
    return True


def feedback_room_label(row: dict) -> str:
    course = re.sub(r"[^a-z0-9]", "", str(row.get("course") or "copd").lower()) or "copd"
    room = re.sub(r"[^A-Z0-9]", "", str(row.get("room") or "").upper())[:8]
    return (course + " " + room).strip()


def feedback_row_values(row: dict) -> list[str]:
    useful = {
        "useful": "Useful",
        "partly": "Partly useful",
        "not": "Not very useful",
    }.get(str(row.get("useful") or ""), str(row.get("useful") or ""))
    return [
        str(row.get("submitted_at") or ""),
        feedback_room_label(row),
        useful,
        str(row.get("comments") or ""),
        str(row.get("email") or ""),
        str(row.get("suggestion") or ""),
        str(row.get("name") or ""),
    ]


def _xlsx_text(value: str) -> str:
    cleaned = "".join(ch for ch in str(value) if ch in "\t\n\r" or ord(ch) >= 32)
    return escape(cleaned)


def _col_index(letters: str) -> int:
    number = 0
    for ch in letters:
        number = number * 26 + ord(ch) - 64
    return number


def _col_name(index: int) -> str:
    letters = ""
    while index:
        index, rem = divmod(index - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def _xlsx_row_xml(index: int, values: list[str]) -> str:
    cells = []
    for offset, value in enumerate(values, start=1):
        ref = "{}{}".format(_col_name(offset), index)
        cells.append(
            '<c r="{}" t="inlineStr"><is><t>{}</t></is></c>'.format(ref, _xlsx_text(value))
        )
    return '<row r="{}">{}</row>'.format(index, "".join(cells))


def _sheet_target(book: zipfile.ZipFile) -> str:
    rels = book.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    match = re.search(r'Target="(?:/xl/)?(worksheets/[^"]+)"', rels)
    if not match:
        raise OSError("Workbook has no worksheet")
    target = match.group(1)
    if target.startswith("xl/"):
        return target
    return "xl/" + target.lstrip("/")


def _shared_strings(book: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in book.namelist():
        return []
    root = ET.fromstring(book.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("{{{}}}si".format(_SHEET_NS)):
        strings.append("".join((node.text or "") for node in item.iter("{{{}}}t".format(_SHEET_NS))))
    return strings


def _cell_text(cell: ET.Element, shared: list[str]) -> str:
    kind = cell.attrib.get("t")
    if kind == "inlineStr":
        return "".join((node.text or "") for node in cell.iter("{{{}}}t".format(_SHEET_NS)))
    node = cell.find("{{{}}}v".format(_SHEET_NS))
    raw = node.text if node is not None and node.text else ""
    if kind == "s" and raw.isdigit() and int(raw) < len(shared):
        return shared[int(raw)]
    return raw


def workbook_rows(data: bytes) -> list[list[str]]:
    with zipfile.ZipFile(io.BytesIO(data)) as book:
        shared = _shared_strings(book)
        root = ET.fromstring(book.read(_sheet_target(book)))
    rows: list[list[str]] = []
    for row in root.findall("{{{}}}sheetData/{{{}}}row".format(_SHEET_NS, _SHEET_NS)):
        cells: dict[int, str] = {}
        for cell in row.findall("{{{}}}c".format(_SHEET_NS)):
            ref = re.match(r"[A-Z]+", cell.attrib.get("r") or "")
            index = _col_index(ref.group(0)) if ref else len(cells) + 1
            cells[index] = _cell_text(cell, shared)
        if not cells:
            rows.append([])
            continue
        width = max(cells)
        rows.append([cells.get(i, "") for i in range(1, width + 1)])
    return rows


def _is_header(row: list[str]) -> bool:
    got = [cell.strip().lower() for cell in row]
    expected = [cell.lower() for cell in FEEDBACK_HEADERS]
    return got[: len(expected)] == expected


def _bump_dimension(xml: str, last_row: int, last_col: int) -> str:
    match = re.search(r'<dimension\b[^>]*\bref="([^"]+)"', xml)
    if not match:
        return xml
    end = match.group(1).split(":")[-1]
    found = re.match(r"([A-Z]+)(\d+)", end)
    if found:
        last_col = max(last_col, _col_index(found.group(1)))
        last_row = max(last_row, int(found.group(2)))
    ref = "A1:{}{}".format(_col_name(last_col), last_row)
    return xml[: match.start(1)] + ref + xml[match.end(1) :]


def _insert_sheet_rows(xml: str, block: str, last_row: int) -> str:
    xml = _bump_dimension(xml, last_row, len(FEEDBACK_HEADERS))
    empty = re.search(r"<sheetData(?:\s[^>]*)?\s*/>", xml)
    if empty:
        return xml[: empty.start()] + "<sheetData>" + block + "</sheetData>" + xml[empty.end() :]
    close = xml.rfind("</sheetData>")
    if close < 0:
        raise OSError("Workbook sheet has no data section")
    return xml[:close] + block + xml[close:]


def _zip_replace(data: bytes, name: str, payload: bytes) -> bytes:
    source = zipfile.ZipFile(io.BytesIO(data))
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as target:
        for info in source.infolist():
            chunk = payload if info.filename == name else source.read(info.filename)
            replacement = zipfile.ZipInfo(filename=info.filename, date_time=info.date_time)
            replacement.compress_type = info.compress_type or zipfile.ZIP_DEFLATED
            replacement.external_attr = info.external_attr
            target.writestr(replacement, chunk)
    return buffer.getvalue()


def xlsx_append(data: bytes, values: list[str]) -> bytes:
    with zipfile.ZipFile(io.BytesIO(data)) as book:
        sheet_name = _sheet_target(book)
        sheet_xml = book.read(sheet_name)
    text = sheet_xml.decode("utf-8")
    root = ET.fromstring(sheet_xml)
    max_row = 0
    for row in root.findall("{{{}}}sheetData/{{{}}}row".format(_SHEET_NS, _SHEET_NS)):
        max_row = max(max_row, int(row.attrib.get("r") or 0))
    rows = workbook_rows(data)
    if not rows or not any(any(cell.strip() for cell in row) for row in rows):
        block = _xlsx_row_xml(1, FEEDBACK_HEADERS) + _xlsx_row_xml(2, values)
        last_row = 2
    else:
        start = (max_row or len(rows)) + 1
        block = _xlsx_row_xml(start, values)
        last_row = start
    updated = _insert_sheet_rows(text, block, last_row)
    return _zip_replace(data, sheet_name, updated.encode("utf-8"))


def build_xlsx(table: list[list[str]]) -> bytes:
    last = max(1, len(table))
    rows_xml = "".join(_xlsx_row_xml(index, row) for index, row in enumerate(table, start=1))
    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="{ns}"><dimension ref="A1:G{last}"/><sheetData>{rows}</sheetData></worksheet>'
    ).format(ns=_SHEET_NS, last=last, rows=rows_xml)
    parts = {
        "[Content_Types].xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            "</Types>"
        ),
        "_rels/.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            "</Relationships>"
        ),
        "xl/workbook.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Feedback" sheetId="1" r:id="rId1"/></sheets></workbook>'
        ).format(ns=_SHEET_NS),
        "xl/_rels/workbook.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            "</Relationships>"
        ),
        "xl/styles.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="{ns}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
            '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
            '<borders count="1"><border/></borders>'
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
            "</styleSheet>"
        ).format(ns=_SHEET_NS),
        "xl/worksheets/sheet1.xml": sheet,
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as book:
        for name, payload in parts.items():
            book.writestr(name, payload)
    return buffer.getvalue()


def get_feedback_session(course_id: str, force: bool = False) -> dict:
    url = feedback_workbook_url(course_id)
    if not url:
        raise OSError("No feedback workbook link is configured")
    now = time.monotonic()
    session = _FEEDBACK_SESSIONS.get(url) or {}
    if (
        force
        or session.get("share") != url
        or now - float(session.get("digest_at") or 0) > 1500
        or not session.get("fed")
    ):
        session = od_connect(url)
        _FEEDBACK_SESSIONS[url] = session
    return session


def feedback_download(session: dict) -> bytes:
    token = encode_share_url(str(session.get("share") or ""))
    return od_http(
        "GET",
        "https://onedrive.live.com/_api/v2.0/shares/" + token + "/root/content",
        headers={"Cookie": "FedAuth=" + session["fed"]},
    )


def feedback_upload(session: dict, content: bytes) -> None:
    guid = str(session.get("folder_guid") or "")
    if not guid:
        raise OSError("Feedback workbook could not be addressed")
    endpoint = session["site"] + "/_api/web/GetFileById('" + guid + "')/$value"
    headers = {
        "Accept": "application/json;odata=verbose",
        "Content-Type": "application/octet-stream",
        "Cookie": "FedAuth=" + session["fed"],
        "X-RequestDigest": session["digest"],
        "X-HTTP-Method": "PUT",
        "IF-MATCH": "*",
    }
    try:
        od_http("POST", endpoint, data=content, headers=headers)
    except urllib.error.HTTPError as err:
        if err.code == 423:
            raise OSError("Feedback workbook is open elsewhere. Close it, then try again.") from err
        raise OSError("Feedback workbook upload failed ({})".format(err.code)) from err


def local_feedback_workbook(course_id: str) -> Path | None:
    course = (course_id or "").strip().casefold()
    if course not in COURSES:
        return None
    path = ROOT / course / "feedback" / (attend_env() + ".xlsx")
    return path if path.is_file() else None


def append_local_workbook(path: Path, values: list[str]) -> None:
    path.write_bytes(xlsx_append(path.read_bytes(), values))


def append_remote_workbook(course_id: str, values: list[str]) -> None:
    last_error: Exception | None = None
    url = feedback_workbook_url(course_id)
    for attempt in range(2):
        try:
            session = get_feedback_session(course_id, force=attempt > 0)
            feedback_upload(session, xlsx_append(feedback_download(session), values))
            return
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, ET.ParseError, zipfile.BadZipFile) as err:
            last_error = err
            if url:
                _FEEDBACK_SESSIONS.pop(url, None)
    raise OSError("Feedback workbook update failed") from last_error


def append_feedback_workbook(row: dict) -> None:
    course = str(row.get("course") or "copd")
    values = feedback_row_values(row)
    if feedback_workbook_url(course):
        try:
            append_remote_workbook(course, values)
        except OSError as err:
            cause = err.__cause__ or err
            code = getattr(cause, "code", None)
            detail = " ({})".format(code) if code else ""
            print("Feedback workbook update failed{}.".format(detail), flush=True)
            raise
        return
    local = local_feedback_workbook(course)
    if local is None:
        raise OSError("No feedback workbook is configured")
    append_local_workbook(local, values)


def save_feedback(row: dict) -> None:
    with FEEDBACK_LOCK:
        append_feedback_workbook(row)


def feedback_csv() -> bytes:
    if not FEEDBACK_FILE.is_file():
        return "submitted_at,course,room,useful,comments,email,suggestion,name\r\n".encode("utf-8")
    return FEEDBACK_FILE.read_bytes()


def _response_count(data: bytes | None) -> int:
    if not data:
        return -1
    try:
        rows = workbook_rows(data)
    except (OSError, ET.ParseError, zipfile.BadZipFile, KeyError, ValueError):
        return -1
    body = rows[1:] if rows and _is_header(rows[0]) else rows
    return sum(1 for row in body if any(cell.strip() for cell in row))


def feedback_workbook_bytes(course_id: str = "copd") -> bytes | None:
    data: bytes | None = None
    if feedback_workbook_url(course_id):
        data = feedback_download(get_feedback_session(course_id))
    else:
        local = local_feedback_workbook(course_id)
        if local is not None:
            data = local.read_bytes()
    if not data or _response_count(data) < 1:
        return None
    return data


def attend_config() -> tuple[str, Path | None]:
    share = (os.environ.get("ATTEND_SHARE_" + attend_env().upper()) or "").strip().strip('"')
    if not share:
        share = (os.environ.get("ATTEND_SHARE_URL") or "").strip().strip('"')
    folder_raw = (os.environ.get("ATTEND_FOLDER_" + attend_env().upper()) or "").strip().strip('"')
    if not folder_raw:
        folder_raw = (os.environ.get("ATTEND_FOLDER") or "").strip().strip('"')
    if ATTEND_CONFIG.exists() and (not share or not folder_raw):
        try:
            lines = ATTEND_CONFIG.read_text(encoding="utf-8").splitlines()
        except OSError:
            lines = []
        parts = attend_file_sections(lines)
        env = attend_env()
        chosen = parts.get(env) or parts["dev"]
        fallback = parts["any"]
        other = parts["live"] if env == "dev" else parts["dev"]
        share = share or chosen["share"] or fallback["share"] or other["share"]
        if not folder_raw:
            folder_raw = chosen["folder"] or fallback["folder"] or other["folder"]
    if not folder_raw:
        folder_raw = str(Path.home() / "OneDrive" / "Documents" / "Hub CPD attendance")
    path = Path(folder_raw) if folder_raw else None
    if path is not None and (os.name != "nt" or "onedrive" not in str(path).lower()):
        path = None
    return share, path


def attend_dir() -> Path | None:
    return attend_config()[1]


def attend_env() -> str:
    return sheet_env_from(os.environ)


def clean_dev_scratch() -> None:
    """Drop leftover room CSVs and session binds in the project folder (DEV only)."""
    if attend_env() != "dev":
        return []
    names = ["certificates.csv", "COPD-CPD-certificate-names.csv", "HF-CPD-certificate-names.csv"]
    paths = [ROOT / name for name in names]
    paths.extend(ROOT.glob("certificates-*.csv"))
    paths.extend(ROOT.glob("session-*.json"))
    removed = []
    for path in paths:
        if not path.is_file() or path.parent.resolve() != ROOT.resolve():
            continue
        try:
            path.unlink()
        except OSError:
            continue
        removed.append(path.name)
    return removed


def certificates_root() -> Path:
    parent = attend_dir()
    if parent is not None and parent.name.lower() in ("dev", "live"):
        return parent.parent
    if parent is not None:
        return parent
    return ROOT / "certificates"


def attend_course_dir(course_id: str) -> Path | None:
    root = certificates_root()
    return root / course_folder_name(course_id) / attend_env()


def repo_course_dir(course_id: str) -> Path:
    return ROOT / "certificates" / course_folder_name(course_id) / attend_env()


def attendance_search_roots(course_id: str | None = None) -> list[Path]:
    folders = [course_folder_name(course_id)] if course_id else [course_folder_name(c["id"]) for c in COURSES.values()]
    if not course_id or course_id == "copd":
        if "COPD" not in folders:
            folders.append("COPD")
    roots: list[Path] = []
    certs = ROOT / "certificates"
    parent = certificates_root()
    for name in folders:
        for env in ("dev", "live"):
            roots.append(parent / name / env)
            roots.append(certs / name / env)
            roots.append(certs / env / name)
            roots.append(certs / name / "dev")
        roots.append(parent / name)
        roots.append(certs / name)
    roots.extend([
        certs / "dev",
        certs / "live",
        certs,
        ROOT,
    ])
    extra = attend_dir()
    if extra is not None:
        roots.append(extra)
    unique: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        key = str(root).casefold()
        if key in seen:
            continue
        seen.add(key)
        unique.append(root)
    return unique


def session_filename(course_id: str = "copd", presenter: str = "", room_id: str = "") -> str:
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    person = filename_person(presenter)
    code = re.sub(r"[^A-Z0-9]", "", (room_id or "").upper())[:8]
    course = course_record(course_id)
    prefix = course["prefix"]
    if code:
        return "{}{}-{}-{}.csv".format(prefix, stamp, person, code)
    return "{}{}-{}.csv".format(prefix, stamp, person)


def session_bind_path(rid: str) -> Path:
    return ROOT / ("session-{}.json".format(rid.lower()))


def save_session_bind(room: Room) -> None:
    payload = {
        "id": room.id,
        "name": room.session_name,
        "cloud": room.session_cloud,
        "url": room.session_url,
        "file": str(room.session_file) if room.session_file else "",
        "course": getattr(room, "course_id", "copd") or "copd",
    }
    try:
        session_bind_path(room.id).write_text(json.dumps(payload), encoding="utf-8")
    except OSError:
        pass


def latest_attendance_file(room_id: str) -> Path | None:
    code = re.sub(r"[^A-Z0-9]", "", (room_id or "").upper())[:8]
    if not code:
        return None
    suffix = "-{}.csv".format(code)
    found: list[Path] = []
    seen: set[str] = set()
    for root in attendance_search_roots():
        if not root.is_dir():
            continue
        for path in root.glob("*-CPD-attendance-*" + suffix):
            key = str(path.resolve()) if path.exists() else str(path)
            if key in seen:
                continue
            seen.add(key)
            found.append(path)
    if not found:
        return None
    return max(found, key=lambda path: path.stat().st_mtime if path.exists() else 0)


def load_room_names(room: Room) -> None:
    path = room.cert_path()
    if not path.is_file():
        return
    try:
        text = path.read_text(encoding="utf-8-sig")
    except OSError:
        return
    try:
        reader = csv.DictReader(io.StringIO(text))
    except csv.Error:
        return
    for row in reader:
        voter = str(row.get("voter") or "").strip()[:80]
        name = clean_name(row.get("name"))
        esr = clean_esr(row.get("esr"))
        email = clean_email(row.get("email"))
        at = str(row.get("submitted_at") or "").strip()
        if not voter or len(name) < 2:
            continue
        room.names[voter] = {"name": name, "esr": esr, "email": email, "at": at}


def restore_room_session(room: Room) -> None:
    if not room.session_name:
        path = session_bind_path(room.id)
        data = {}
        if path.is_file():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError, TypeError):
                data = {}
        name = str(data.get("name") or "")
        if name:
            room.session_name = name
            room.session_cloud = bool(data.get("cloud"))
            room.session_url = str(data.get("url") or "")
            course = str(data.get("course") or "").strip().casefold()
            if course in COURSES:
                room.course_id = course
            elif str(name).startswith("HF-CPD-"):
                room.course_id = "hf"
            file_raw = str(data.get("file") or "")
            if file_raw:
                room.session_file = Path(file_raw)
        else:
            found = latest_attendance_file(room.id)
            if found is not None:
                room.session_name = found.name
                room.session_file = found
    if not room.names:
        load_room_names(room)


def attach_session(room: Room) -> None:
    if room.bound:
        return
    restore_room_session(room)
    room.bound = True
    if room.names and room.session_name:
        threading.Thread(target=_flush_session, args=(room,), daemon=True).start()


def _flush_session(room: Room) -> None:
    try:
        save_names(room)
    except OSError as err:
        print("Attendance flush: {}".format(err), flush=True)


def filename_person(raw: str) -> str:
    text = clean_name(raw)
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return (text[:40] or "facilitator")


def encode_share_url(url: str) -> str:
    b64 = base64.b64encode(url.encode("utf-8")).decode("ascii").rstrip("=")
    return "u!" + b64.replace("+", "-").replace("/", "_")


def od_folder_rel(root: dict) -> str:
    parent = str((root.get("parentReference") or {}).get("path") or "")
    name = str(root.get("name") or "certificates")
    rel = ""
    if "/root:" in parent:
        rel = parent.split("/root:", 1)[1].strip("/")
    parts = ["Documents"]
    if rel:
        parts.append(rel)
    parts.append(name)
    return "/".join(parts)


def od_folder_guid(root: dict) -> str:
    etag = str(root.get("eTag") or "")
    match = re.search(r"\{([0-9A-Fa-f-]{36})\}", etag)
    if match:
        return match.group(1)
    item_id = str(root.get("id") or "")
    if "!s" in item_id:
        hexid = item_id.split("!s", 1)[1]
        if len(hexid) == 32:
            return "{}-{}-{}-{}-{}".format(
                hexid[0:8], hexid[8:12], hexid[12:16], hexid[16:20], hexid[20:32]
            )
    return ""


def od_http(method: str, endpoint: str, data: bytes | None = None, headers: dict | None = None) -> bytes:
    hdr = {"User-Agent": OD_UA, "Accept": "application/json"}
    if headers:
        hdr.update(headers)
    req = urllib.request.Request(endpoint, data=data, method=method, headers=hdr)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def od_connect(share_url: str) -> dict:
    jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.open(urllib.request.Request(share_url, headers={"User-Agent": OD_UA}), timeout=20)
    fed = next((cookie.value for cookie in jar if cookie.name == "FedAuth"), "")
    if not fed:
        raise OSError("OneDrive did not grant access to the shared folder")
    token = encode_share_url(share_url)
    raw = od_http(
        "GET",
        "https://onedrive.live.com/_api/v2.0/shares/" + token + "/root",
        headers={"Cookie": "FedAuth=" + fed},
    )
    root = json.loads(raw.decode("utf-8"))
    ctx = str(root.get("@odata.context") or "")
    site = ctx.split("/_api/")[0] if "/_api/" in ctx else ""
    if not site:
        raise OSError("Could not resolve the OneDrive folder")
    digest_raw = od_http(
        "POST",
        site + "/_api/contextinfo",
        data=b"",
        headers={
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "Cookie": "FedAuth=" + fed,
        },
    )
    digest = json.loads(digest_raw.decode("utf-8"))["d"]["GetContextWebInformation"]["FormDigestValue"]
    return {
        "share": share_url,
        "fed": fed,
        "digest": digest,
        "digest_at": time.monotonic(),
        "site": site,
        "folder_rel": od_folder_rel(root),
        "folder_guid": od_folder_guid(root),
    }


def prepare_local_dir(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    if os.name != "nt":
        return
    try:
        import ctypes

        ctypes.windll.kernel32.SetFileAttributesW(str(folder), 0x10)
    except OSError:
        pass


def write_local_bytes(path: Path, body: bytes) -> Path | None:
    prepare_local_dir(path.parent)
    with path.open("wb") as handle:
        handle.write(body)
        handle.flush()
        os.fsync(handle.fileno())
    if os.name == "nt":
        try:
            import ctypes

            ctypes.windll.kernel32.SetFileAttributesW(str(path), 0x80)
        except OSError:
            pass
    if path.is_file():
        return path
    return None


def od_list_names(session: dict, folder_rel: str | None = None) -> set[str]:
    rel = folder_rel or session["folder_rel"]
    folder = quote(rel, safe="/")
    try:
        raw = od_http(
            "GET",
            session["site"] + "/_api/web/GetFolderByServerRelativeUrl(@p)/Files?@p='" + folder + "'&$select=Name",
            headers={
                "Accept": "application/json;odata=verbose",
                "Cookie": "FedAuth=" + session["fed"],
            },
        )
    except urllib.error.HTTPError as err:
        if err.code in (404, 400):
            return set()
        raise
    rows = json.loads(raw.decode("utf-8")).get("d", {}).get("results") or []
    return {str(row.get("Name") or "") for row in rows}


def od_download(session: dict, filename: str, folder_rel: str | None = None) -> bytes:
    rel = urlparse(session["site"]).path.rstrip("/") + "/" + (folder_rel or session["folder_rel"]) + "/" + filename
    url = (
        session["site"]
        + "/_api/web/GetFileByServerRelativePath(decodedurl=@p)/$value?@p='"
        + quote(rel, safe="/")
        + "'"
    )
    return od_http("GET", url, headers={"Cookie": "FedAuth=" + session["fed"]})


def od_folder_meta(session: dict, folder_rel: str) -> dict:
    folder = quote(folder_rel, safe="/")
    try:
        raw = od_http(
            "GET",
            session["site"]
            + "/_api/web/GetFolderByServerRelativeUrl(@p)?@p='"
            + folder
            + "'&$select=Name,Exists,UniqueId,ServerRelativeUrl",
            headers={
                "Accept": "application/json;odata=verbose",
                "Cookie": "FedAuth=" + session["fed"],
            },
        )
    except urllib.error.HTTPError as err:
        if err.code in (404, 400):
            return {"exists": False, "name": "", "unique_id": "", "url": ""}
        raise
    info = json.loads(raw.decode("utf-8")).get("d") or {}
    unique = str(info.get("UniqueId") or "").strip("{}")
    return {
        "exists": bool(info.get("Exists")),
        "name": str(info.get("Name") or ""),
        "unique_id": unique,
        "url": str(info.get("ServerRelativeUrl") or ""),
    }


def od_folder_exists(session: dict, folder_rel: str) -> bool:
    return bool(od_folder_meta(session, folder_rel).get("exists"))


def od_put(session: dict, filename: str, content: bytes, folder_rel: str | None = None) -> None:
    site = session["site"]
    target = folder_rel or session["folder_rel"]
    headers = {
        "Accept": "application/json;odata=verbose",
        "Content-Type": "application/octet-stream",
        "Cookie": "FedAuth=" + session["fed"],
        "X-RequestDigest": session["digest"],
    }
    meta = od_folder_meta(session, target)
    if not meta.get("exists"):
        raise OSError("OneDrive folder does not exist")
    endpoints = []
    guid = meta.get("unique_id") or ""
    if guid:
        endpoints.append(
            site
            + "/_api/web/GetFolderById(guid'"
            + guid
            + "')/Files/add(overwrite=true,url=@f)?@f='"
            + quote(filename, safe="")
            + "'"
        )
    full = urlparse(session["site"]).path.rstrip("/") + "/" + target
    endpoints.append(
        site
        + "/_api/web/GetFolderByServerRelativePath(decodedurl=@p)/Files/add(overwrite=true,url=@f)"
        + "?@p='"
        + quote(full, safe="/")
        + "'&@f='"
        + quote(filename, safe="")
        + "'"
    )
    last_error: OSError | None = None
    for endpoint in endpoints:
        try:
            od_http("POST", endpoint, data=content, headers=headers)
            return
        except urllib.error.HTTPError as err:
            last_error = OSError("OneDrive upload failed ({})".format(err.code))
            if err.code == 401:
                raise last_error
    if last_error:
        raise last_error
    raise OSError("OneDrive upload failed")


def od_share_name(session: dict) -> str:
    return session["folder_rel"].rstrip("/").split("/")[-1]


def od_share_is_certificates_root(session: dict) -> bool:
    return od_share_name(session).lower() == "certificates"


def od_ensure_child(session: dict, child: str, parent: str | None = None) -> str:
    parent = (parent or session["folder_rel"]).rstrip("/")
    rel = parent + "/" + child
    cache = session.setdefault("course_folders", {})
    if rel in cache:
        return cache[rel]
    if od_folder_exists(session, rel):
        cache[rel] = rel
        return rel
    headers = {
        "Accept": "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "Cookie": "FedAuth=" + session["fed"],
        "X-RequestDigest": session["digest"],
    }
    endpoint = (
        session["site"]
        + "/_api/web/GetFolderByServerRelativeUrl(@p)/Folders/add(url=@n)"
        + "?@p='"
        + quote(parent, safe="/")
        + "'&@n='"
        + quote(child, safe="")
        + "'"
    )
    try:
        od_http("POST", endpoint, data=b"", headers=headers)
    except urllib.error.HTTPError as err:
        if err.code not in (409, 400) or not od_folder_exists(session, rel):
            raise
    if not od_folder_exists(session, rel):
        raise OSError("Could not create the OneDrive {} folder".format(child))
    cache[rel] = rel
    return rel


def get_od_session() -> dict:
    share, _folder = attend_config()
    if not share:
        raise OSError("No OneDrive folder link is configured")
    global _OD
    now = time.monotonic()
    session = _OD
    if (
        session.get("share") != share
        or now - float(session.get("digest_at") or 0) > 1500
        or not session.get("fed")
        or not session.get("digest")
    ):
        session = od_connect(share)
        _OD = session
    return session


def od_course_folder(session: dict, course_id: str) -> str:
    """certificates / {course} / {env} when the share is the certificates parent."""
    course = course_folder_name(course_id)
    env = attend_env()
    if env not in ("dev", "live"):
        env = "dev"
    if not od_share_is_certificates_root(session):
        raise OSError(
            "OneDrive share is '{}', not the certificates folder. "
            "Share the parent certificates folder so files go in copd/dev and heart failure/dev.".format(
                od_share_name(session)
            )
        )
    course_rel = od_ensure_child(session, course)
    dest = od_ensure_child(session, env, parent=course_rel)
    leaf = dest.rstrip("/").split("/")[-1].lower()
    if leaf not in ("dev", "live"):
        raise OSError("Attendance files must go in a dev or live folder, not {}".format(leaf))
    return dest


def od_path_in_share(session: dict, folder_rel: str, filename: str) -> str:
    root = session["folder_rel"].rstrip("/")
    dest = (folder_rel or root).rstrip("/")
    if dest == root:
        return filename
    if dest.startswith(root + "/"):
        return dest[len(root) + 1 :] + "/" + filename
    return filename


def od_upload(filename: str, content: bytes, course_id: str = "") -> dict:
    session = get_od_session()
    folder_rel = od_course_folder(session, course_id) if course_id else session["folder_rel"]
    try:
        od_put(session, filename, content, folder_rel)
    except OSError:
        session = od_connect(attend_config()[0])
        global _OD
        _OD = session
        folder_rel = od_course_folder(session, course_id) if course_id else session["folder_rel"]
        od_put(session, filename, content, folder_rel)
    if filename not in od_list_names(session, folder_rel):
        session = od_connect(attend_config()[0])
        _OD = session
        folder_rel = od_course_folder(session, course_id) if course_id else session["folder_rel"]
        od_put(session, filename, content, folder_rel)
        if filename not in od_list_names(session, folder_rel):
            raise OSError("OneDrive did not keep the attendance file")
    return session


def od_file_web_url(session: dict, filename: str, course_id: str = "") -> str:
    share, _folder = attend_config()
    folder_rel = od_course_folder(session, course_id) if course_id else session["folder_rel"]
    nested = od_path_in_share(session, folder_rel, filename)
    token = encode_share_url(share) if share else ""
    if token:
        try:
            raw = od_http(
                "GET",
                "https://onedrive.live.com/_api/v2.0/shares/" + token + "/root:/" + quote(nested),
                headers={"Cookie": "FedAuth=" + session["fed"]},
            )
            item = json.loads(raw.decode("utf-8"))
            web = str(item.get("webUrl") or "")
            if web:
                return web
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
            pass
    rel = urlparse(session["site"]).path.rstrip("/") + "/" + folder_rel + "/" + filename
    try:
        raw = od_http(
            "GET",
            session["site"]
            + "/_api/web/GetFileByServerRelativePath(decodedurl=@p)?@p='"
            + quote(rel, safe="/")
            + "'&$select=LinkingUrl,Name",
            headers={
                "Accept": "application/json;odata=verbose",
                "Cookie": "FedAuth=" + session["fed"],
            },
        )
        info = json.loads(raw.decode("utf-8")).get("d") or {}
        web = str(info.get("LinkingUrl") or "")
        if web:
            return web
    except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
        pass
    return share


def session_folder_label(course_id: str) -> str:
    share, folder = attend_config()
    child = course_folder_name(course_id)
    if share:
        return "certificates/{}/{}".format(child, attend_env())
    dest = attend_course_dir(course_id) or repo_course_dir(course_id)
    return str(dest)


def session_status(room: Room, course_id: str = "") -> dict:
    share, folder = attend_config()
    course = getattr(room, "course_id", "copd") or "copd"
    if not room.session_name and course_id in COURSES:
        course = course_id
    child = course_folder_name(course)
    name = room.session_name or ""
    local = room.session_file if room.session_file and room.session_file.is_file() else None
    started = bool(name)
    if share:
        folder_label = session_folder_label(course)
        file_label = "{}/{}/{}".format(child, attend_env(), name) if started else ""
    else:
        folder_label = session_folder_label(course)
        file_label = str(local) if local else name
    return {
        "ok": True,
        "room": room.id,
        "folder": folder_label,
        "file": file_label,
        "name": name,
        "count": len(room.names),
        "ready": bool(folder or share),
        "exists": started and (room.session_cloud or bool(local)),
        "started": started,
        "cloud": room.session_cloud,
        "url": room.session_url,
        "course": course,
    }


def names_human_csv(room: Room) -> bytes:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["submitted_at", "name", "esr", "email"])
    writer.writeheader()
    rows = sorted(room.names.values(), key=lambda row: (row.get("name") or "").casefold())
    for row in rows:
        writer.writerow({
            "submitted_at": row.get("at") or "",
            "name": row.get("name") or "",
            "esr": row.get("esr") or "",
            "email": row.get("email") or "",
        })
    return buf.getvalue().encode("utf-8-sig")


def public_courses() -> list[dict]:
    return [
        {"id": c["id"], "title": c["title"], "detail": c["detail"]}
        for c in COURSES.values()
    ]


def write_course_copies(course_id: str, filename: str, body: bytes) -> Path | None:
    written = None
    extra = attend_course_dir(course_id)
    repo = repo_course_dir(course_id)
    dests = []
    if extra is not None and extra.resolve() != repo.resolve():
        dests.append(extra)
    for folder in dests:
        try:
            path = write_local_bytes(folder / filename, body)
        except OSError:
            continue
        if path is not None:
            written = path
    return written


def start_session_file(room: Room, presenter: str = "", course_id: str = "copd") -> tuple[str | None, str]:
    lead = clean_name(presenter)
    if len(lead) < 2:
        return None, "Enter the name of the person delivering this session."
    course = course_id if course_id in COURSES else "copd"
    share, folder = attend_config()
    if not share and folder is None:
        return None, "No OneDrive folder is configured. Set ATTEND_SHARE_DEV and ATTEND_SHARE_LIVE in .env, or ATTEND_SHARE_URL on Render."
    dest = attend_course_dir(course) or repo_course_dir(course)
    with LOCK:
        name = session_filename(course, lead, room.id)
        room.session_name = name
        room.session_cloud = False
        room.session_file = dest / name
        room.session_url = ""
        room.bound = True
        room.course_id = course
        body = names_human_csv(room)
    if share:
        try:
            od_session = od_upload(name, body, course)
            web = od_file_web_url(od_session, name, course)
            with LOCK:
                room.session_cloud = True
                room.session_url = web
            written = write_course_copies(course, name, body)
            if written is not None:
                with LOCK:
                    room.session_file = written
            save_session_bind(room)
            print("Attendance file [{}]: {}/{}/{}".format(room.id, course_folder_name(course), attend_env(), name), flush=True)
            return name, ""
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError) as err:
            print("OneDrive upload: {}".format(err), flush=True)
            return None, "Could not create the file in the OneDrive {}/{} folder: {}".format(
                course_folder_name(course), attend_env(), err
            )
    try:
        written = write_course_copies(course, name, body)
    except OSError as err:
        return None, "Could not write the attendance file: {}".format(err)
    if written is None:
        return None, "Could not create the attendance file."
    with LOCK:
        room.session_file = written
    save_session_bind(room)
    print("Attendance file [{}]: {}".format(room.id, written), flush=True)
    return name, ""


def write_human_csv(room: Room, path: Path) -> None:
    if write_local_bytes(path, names_human_csv(room)) is None:
        raise OSError("Could not write " + str(path))


def save_names(room: Room) -> None:
    restore_room_session(room)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["submitted_at", "voter", "name", "esr", "email"])
    writer.writeheader()
    for voter, row in room.names.items():
        writer.writerow({
            "submitted_at": row.get("at") or "",
            "voter": voter,
            "name": row.get("name") or "",
            "esr": row.get("esr") or "",
            "email": row.get("email") or "",
        })
    room.cert_path().write_text(buf.getvalue(), encoding="utf-8-sig")
    course = getattr(room, "course_id", "copd") or "copd"
    share, _folder = attend_config()
    body = names_human_csv(room)
    if share and room.session_name:
        try:
            od_upload(room.session_name, body, course)
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError) as err:
            print("OneDrive upload: {}".format(err), flush=True)
        else:
            save_session_bind(room)
        written = write_course_copies(course, room.session_name, body)
        if written is not None:
            room.session_file = written
        return
    if share and not room.session_name:
        print("Certificate name kept, but no OneDrive file is bound for [{}].".format(room.id), flush=True)
        return
    if room.session_name:
        written = write_course_copies(course, room.session_name, body)
        if written is not None:
            room.session_file = written
            save_session_bind(room)


def notify_name(name: str, at: str, esr: str = "", email: str = "") -> None:
    print("Certificate name: {}  ESR: {}  Email: {}".format(name, esr or "(none)", email or "(none)"), flush=True)
    if not CERT_WEBHOOK:
        return

    def send() -> None:
        payload = json.dumps({"name": name, "esr": esr, "email": email, "at": at, "session": "COPD CPD"}).encode("utf-8")
        req = urllib.request.Request(
            CERT_WEBHOOK,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=8).read()
        except (urllib.error.URLError, TimeoutError, OSError, ValueError):
            pass

    threading.Thread(target=send, daemon=True).start()


def names_csv(room: Room) -> bytes:
    return names_human_csv(room)


def with_room_meta(room: Room, payload: dict, include_names: bool = False) -> dict:
    rec = course_record(getattr(room, "course_id", "copd") or "copd")
    payload["register"] = room.register_open
    payload["feedback"] = room.feedback_open
    payload["nameCount"] = len(room.names)
    payload["room"] = room.id
    payload["course"] = rec["id"]
    payload["courseTitle"] = rec["title"]
    payload["courseDetail"] = rec["detail"]
    if include_names:
        payload["names"] = sorted(
            (row.get("name") or "" for row in room.names.values()),
            key=str.casefold,
        )
    return payload


def public_poll(room: Room, include_names: bool = False) -> dict:
    poll = room.poll
    if poll.get("kind") == "news2":
        scale1 = scale2 = correct = 0
        spread_counts = {}
        for vote in poll["votes"].values():
            if not isinstance(vote, dict):
                continue
            if vote.get("scale") == 1:
                scale1 += 1
            elif vote.get("scale") == 2:
                scale2 += 1
            if (
                vote.get("scale") == poll.get("expectedScale")
                and vote.get("total") == poll.get("expectedTotal")
            ):
                correct += 1
            total = vote.get("total")
            scale = vote.get("scale")
            if isinstance(total, int) and scale in (1, 2):
                key = (total, scale)
                spread_counts[key] = spread_counts.get(key, 0) + 1
        revealed = poll["revealed"]
        out = {
            "live": True,
            "kind": "news2",
            "id": poll["id"],
            "prompt": poll["prompt"],
            "obs": poll.get("obs") or {},
            "options": [],
            "open": poll["open"],
            "revealed": revealed,
            "total": len(poll["votes"]),
            "counts": [],
            "scale1": scale1,
            "scale2": scale2,
            "correctScale1": correct,
            "correctCount": correct,
            "spread": [
                {"total": total, "scale": scale, "n": n}
                for (total, scale), n in sorted(spread_counts.items())
            ],
            "expectedTotal": poll.get("expectedTotal"),
            "expectedScale": poll.get("expectedScale"),
            "correct": None,
            "teach": poll["teach"] if revealed else "",
        }
        return with_room_meta(room, out, include_names)
    options = poll["options"]
    counts = [0] * len(options)
    for choice in poll["votes"].values():
        if isinstance(choice, int) and 0 <= choice < len(counts):
            counts[choice] += 1
    revealed = poll["revealed"]
    return with_room_meta(room, {
        "live": True,
        "kind": "choice",
        "id": poll["id"],
        "prompt": poll["prompt"],
        "options": options,
        "open": poll["open"],
        "revealed": revealed,
        "counts": counts,
        "total": sum(counts),
        "correct": poll["correct"] if revealed else None,
        "teach": poll["teach"] if revealed else "",
    }, include_names)


def qr_svg(text: str) -> bytes:
    qr = QrCode.encode_text(text, QrCode.Ecc.MEDIUM)
    n = qr.get_size()
    pad = 2
    dark = "#081510"
    light = "#f3f5f0"
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n + pad * 2} {n + pad * 2}"'
        f' shape-rendering="crispEdges">'
        f'<rect width="100%" height="100%" fill="{light}"/>'
    ]
    for y in range(n):
        for x in range(n):
            if qr.get_module(x, y):
                parts.append(
                    f'<rect x="{x + pad}" y="{y + pad}" width="1" height="1" fill="{dark}"/>'
                )
    parts.append("</svg>")
    return "".join(parts).encode("utf-8")


def read_json(handler: SimpleHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length") or 0)
    if length < 0 or length > 20000:
        return {}
    raw = handler.rfile.read(length) if length else b""
    try:
        data = json.loads(raw.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def send_json(handler: SimpleHTTPRequestHandler, payload: dict, status: int = 200) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def send_bytes(
    handler: SimpleHTTPRequestHandler,
    body: bytes,
    content_type: str,
    status: int = 200,
    filename: str | None = None,
) -> None:
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Cache-Control", "no-store")
    if filename:
        handler.send_header("Content-Disposition", f'attachment; filename="{filename}"')
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def same_origin(handler: SimpleHTTPRequestHandler) -> bool:
    host = (handler.headers.get("Host") or "").split(",")[0].strip().lower()
    origin = (handler.headers.get("Origin") or "").strip()
    referer = (handler.headers.get("Referer") or "").strip()
    for raw in (origin, referer):
        if not raw:
            continue
        netloc = urlparse(raw).netloc.lower()
        if netloc == host:
            return True
    return False


def snapshot_poll(room: Room) -> None:
    poll = room.poll
    pid = poll.get("id")
    if not pid or not poll.get("votes"):
        return
    room.history[pid] = {
        "id": pid,
        "kind": poll.get("kind"),
        "prompt": poll.get("prompt") or "",
        "options": list(poll.get("options") or []),
        "expectedTotal": poll.get("expectedTotal"),
        "expectedScale": poll.get("expectedScale"),
        "correct": poll.get("correct"),
        "votes": dict(poll.get("votes") or {}),
    }


def results_csv(room: Room) -> bytes:
    snapshot_poll(room)
    buf = io.StringIO()
    fields = [
        "poll_id",
        "prompt",
        "kind",
        "anonymous_id",
        "scale",
        "news_total",
        "rr",
        "spo2",
        "air_or_oxygen",
        "sbp",
        "pulse",
        "consciousness",
        "temp",
        "choice",
        "choice_label",
        "correct",
    ]
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for pid, snap in room.history.items():
        options = snap.get("options") or []
        votes = snap.get("votes") or {}
        for anon, vote in enumerate(votes.values(), 1):
            row = {
                "poll_id": pid,
                "prompt": snap.get("prompt") or "",
                "kind": snap.get("kind") or "",
                "anonymous_id": anon,
                "scale": "",
                "news_total": "",
                "rr": "",
                "spo2": "",
                "air_or_oxygen": "",
                "sbp": "",
                "pulse": "",
                "consciousness": "",
                "temp": "",
                "choice": "",
                "choice_label": "",
                "correct": "",
            }
            if isinstance(vote, dict):
                scores = vote.get("scores") or {}
                scale = vote.get("scale")
                total = vote.get("total")
                row["scale"] = scale
                row["news_total"] = total
                row["rr"] = scores.get("rr", "")
                row["spo2"] = scores.get("spo2", "")
                row["air_or_oxygen"] = scores.get("o2", "")
                row["sbp"] = scores.get("sbp", "")
                row["pulse"] = scores.get("pulse", "")
                row["consciousness"] = scores.get("con", "")
                row["temp"] = scores.get("temp", "")
                expected_scale = snap.get("expectedScale")
                expected_total = snap.get("expectedTotal")
                if expected_scale is not None and expected_total is not None:
                    row["correct"] = (
                        "yes"
                        if scale == expected_scale and total == expected_total
                        else "no"
                    )
            elif isinstance(vote, int):
                row["choice"] = vote
                if 0 <= vote < len(options):
                    row["choice_label"] = options[vote]
                expected = snap.get("correct")
                if isinstance(expected, int):
                    row["correct"] = "yes" if vote == expected else "no"
            writer.writerow(row)
    return buf.getvalue().encode("utf-8-sig")


def authorised_host(handler: SimpleHTTPRequestHandler) -> bool:
    return secret_is_host(request_host_secret(handler))


def reset_poll(poll: dict) -> None:
    poll["open"] = False
    poll["id"] = None
    poll["kind"] = "choice"
    poll["prompt"] = ""
    poll["options"] = []
    poll["obs"] = {}
    poll["correct"] = None
    poll["expectedTotal"] = None
    poll["expectedScale"] = None
    poll["teach"] = ""
    poll["revealed"] = False
    poll["votes"] = {}


class Handler(SimpleHTTPRequestHandler):
    timeout = 90

    def handle(self) -> None:
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError, TimeoutError, OSError):
            pass

    def log_message(self, fmt: str, *args) -> None:
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            return
        super().log_message(fmt, *args)

    def room_for(self, create: bool = False) -> Room | None:
        room = get_room(request_room_id(self), create=create)
        if room is not None and not room.session_name:
            course = request_course_id(self)
            if course:
                room.course_id = course
        return room

    def do_GET(self) -> None:
        if redirect_legacy_host(self):
            return
        parsed = urlparse(self.path)
        path = parsed.path
        if path in ("/v", "/vote", "/v/"):
            rid = request_room_id(self)
            loc = "/?view=vote"
            if rid:
                loc += "&r=" + rid
            course = request_course_id(self)
            if not course and rid:
                with LOCK:
                    room = get_room(rid, create=False)
                if room is not None:
                    course = getattr(room, "course_id", "") or ""
                    if course not in COURSES:
                        course = ""
            if course:
                loc += "&course=" + course
            self.send_response(302)
            self.send_header("Location", loc)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        if path in ("/feedback", "/feedback/"):
            rid = request_room_id(self)
            course = request_course_id(self)
            loc = "/?view=feedback"
            if course:
                loc += "&course=" + quote(course)
            if rid:
                loc += "&r=" + rid
            self.send_response(302)
            self.send_header("Location", loc)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        if path in ("/lookup", "/lookup/", "/certificate"):
            self.send_response(302)
            self.send_header("Location", "/")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        if path == "/handout.html":
            self.send_response(302)
            self.send_header("Location", "/copd/handout.html")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            return
        if path == "/handout-hf.html":
            self.send_response(302)
            self.send_header("Location", "/hf/handout.html")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            return
        if path == "/api/courses":
            send_json(self, {"ok": True, "courses": public_courses()})
            return
        if path == "/healthz":
            send_json(self, {"ok": True})
            return
        if path == "/api/join":
            with LOCK:
                if authorised_host(self):
                    room = self.room_for(create=True)
                else:
                    room = self.room_for(create=False)
                rid = room.id if room else ""
                join = join_url(self, rid, getattr(room, "course_id", "") if room else "")
                payload = {"live": True, "join": join, "room": rid, "ips": lan_ips(), "port": PORT}
                if authorised_host(self):
                    payload["host"] = True
                    secret = request_host_secret(self)
                    if secret_is_host(secret):
                        payload["hostToken"] = secret
                        who = presenter_for_token(secret)
                        if who:
                            payload["presenter"] = who
            send_json(self, payload)
            return
        if path == "/api/poll":
            with LOCK:
                room = self.room_for(create=False)
                if room is None:
                    send_json(self, {"ok": False, "live": False, "error": "no room"}, 404)
                    return
                send_json(self, public_poll(room, include_names=authorised_host(self)))
            return
        if path in ("/api/feedback.csv", "/api/feedback.xlsx"):
            if not authorised_host(self):
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            course = request_course_id(self) or "copd"
            if path == "/api/feedback.csv":
                send_bytes(
                    self,
                    feedback_csv(),
                    "text/csv; charset=utf-8",
                    filename="{}-cpd-feedback.csv".format(course),
                )
                return
            try:
                body = feedback_workbook_bytes(course)
            except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, ET.ParseError, zipfile.BadZipFile):
                print("Feedback workbook download failed.", flush=True)
                send_json(self, {"ok": False, "error": "could not read feedback"}, 500)
                return
            if not body:
                send_json(self, {"ok": False, "error": "empty"}, 404)
                return
            send_bytes(
                self,
                body,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename="{}-cpd-feedback.xlsx".format(course),
            )
            return
        if path == "/api/session":
            if not authorised_host(self):
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            with LOCK:
                room = self.room_for(create=False)
            course = request_course_id(self) or "copd"
            if room is None:
                share, folder = attend_config()
                send_json(self, {
                    "ok": True,
                    "room": "",
                    "folder": session_folder_label(course) if (share or folder) else "",
                    "file": "",
                    "name": "",
                    "count": 0,
                    "ready": bool(folder or share),
                    "exists": False,
                    "started": False,
                    "cloud": False,
                    "url": "",
                    "course": course,
                })
                return
            send_json(self, session_status(room, course))
            return
        if path == "/api/results.csv":
            if not authorised_host(self):
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            with LOCK:
                room = self.room_for(create=False)
                if room is None:
                    send_json(self, {"ok": False, "error": "no room"}, 404)
                    return
                body = results_csv(room)
            send_bytes(self, body, "text/csv; charset=utf-8", filename="copd-cpd-results.csv")
            return
        if path == "/api/certificates.csv":
            if not authorised_host(self):
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            with LOCK:
                room = self.room_for(create=False)
                if room is None:
                    send_json(self, {"ok": False, "error": "no room"}, 404)
                    return
                body = names_csv(room)
            send_bytes(self, body, "text/csv; charset=utf-8", filename="copd-cpd-certificates.csv")
            return
        if path == "/qr.svg":
            send_bytes(self, qr_svg(requested_join(self)), "image/svg+xml; charset=utf-8")
            return
        super().do_GET()

    def do_POST(self) -> None:
        if redirect_legacy_host(self):
            return
        parsed = urlparse(self.path)
        path = parsed.path
        data = read_json(self)
        if path == "/api/feedback":
            if not feedback_allowed(self.client_address[0]):
                send_json(self, {"ok": False, "error": "try later"}, 429)
                return
            useful = str(data.get("useful") or "").strip()
            if useful not in ("useful", "partly", "not"):
                send_json(self, {"ok": False, "error": "missing rating"}, 400)
                return
            email = clean_feedback_text(data.get("email"), 120)
            if email and not _EMAIL_RE.fullmatch(email):
                send_json(self, {"ok": False, "error": "bad email"}, 400)
                return
            course = str(data.get("course") or "").strip().casefold()
            if course not in COURSES:
                course = request_course_id(self) or "copd"
            row = {
                "submitted_at": utc_now(),
                "course": course,
                "room": re.sub(r"[^A-Z0-9]", "", str(data.get("room") or "").upper())[:8],
                "useful": useful,
                "comments": clean_feedback_text(data.get("comments"), 800),
                "email": email,
                "suggestion": clean_feedback_text(data.get("suggestion"), 800),
                "name": clean_feedback_text(data.get("name"), 80),
            }
            try:
                save_feedback(row)
            except OSError:
                send_json(self, {"ok": False, "error": "could not save"}, 500)
                return
            send_json(self, {"ok": True})
            return
        if path == "/api/certificate":
            voter = str(data.get("voter") or "").strip()[:80]
            name = clean_name(data.get("name"))
            esr = clean_esr(data.get("esr"))
            email = clean_email(data.get("email"))
            if not voter or len(name) < 2:
                send_json(self, {"ok": False, "error": "missing name"}, 400)
                return
            if len(esr) < 4:
                send_json(self, {"ok": False, "error": "missing esr"}, 400)
                return
            if not email:
                send_json(self, {"ok": False, "error": "missing email"}, 400)
                return
            with LOCK:
                room = self.room_for(create=False)
                if room is None:
                    send_json(self, {"ok": False, "error": "no room"}, 404)
                    return
                if not room.register_open:
                    send_json(self, {"ok": False, "error": "register closed"}, 400)
                    return
                if voter not in room.names and len(room.names) >= 400:
                    send_json(self, {"ok": False, "error": "full"}, 400)
                    return
                room.names[voter] = {"name": name, "esr": esr, "email": email, "at": utc_now()}
                at = room.names[voter]["at"]
            try:
                save_names(room)
            except OSError:
                pass
            notify_name(name, at, esr, email)
            rec = course_record(getattr(room, "course_id", "copd") or "copd")
            send_json(self, {
                "ok": True,
                "poll": public_poll(room),
                "name": name,
                "esr": esr,
                "email": email,
                "title": rec["title"],
                "detail": rec["detail"],
                "date": at,
            })
            return
        if path == "/api/session/start":
            if not authorised_host(self):
                print("Attendance file refused from {}".format(self.client_address[0]), flush=True)
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            presenter = presenter_for_token(request_host_secret(self)) or str(data.get("presenter") or "")
            course = str(data.get("course") or "copd").strip().casefold()
            if course not in COURSES:
                course = "copd"
            print("Attendance file from {} ({}) [{}]".format(self.client_address[0], presenter, course), flush=True)
            with LOCK:
                room = self.room_for(create=True)
            path_out, err = start_session_file(room, presenter, course)
            if path_out is None:
                send_json(self, {"ok": False, "error": err}, 400)
                return
            send_json(self, {**session_status(room), "ok": True})
            return
        if path == "/api/vote":
            voter = str(data.get("voter") or "").strip()[:80]
            if not voter:
                send_json(self, {"ok": False, "error": "missing voter"}, 400)
                return
            with LOCK:
                room = self.room_for(create=False)
                if room is None:
                    send_json(self, {"ok": False, "error": "no room", "poll": {"live": False}}, 404)
                    return
                poll = room.poll
                if not poll["open"] or poll["revealed"]:
                    send_json(self, {"ok": False, "error": "closed", "poll": public_poll(room)})
                    return
                if poll.get("kind") == "news2":
                    try:
                        scale = int(data.get("scale"))
                    except (TypeError, ValueError):
                        send_json(self, {"ok": False, "error": "bad vote"}, 400)
                        return
                    if scale not in (1, 2):
                        send_json(self, {"ok": False, "error": "bad scale"}, 400)
                        return
                    scores = data.get("scores") if isinstance(data.get("scores"), dict) else {}
                    keys = ("rr", "spo2", "o2", "sbp", "pulse", "con", "temp")
                    parsed_scores = {}
                    for key in keys:
                        try:
                            val = int(scores.get(key))
                        except (TypeError, ValueError):
                            send_json(self, {"ok": False, "error": "incomplete"}, 400)
                            return
                        if val not in (0, 1, 2, 3):
                            send_json(self, {"ok": False, "error": "bad score"}, 400)
                            return
                        parsed_scores[key] = val
                    poll["votes"][voter] = {
                        "scale": scale,
                        "total": sum(parsed_scores.values()),
                        "scores": parsed_scores,
                    }
                    snapshot_poll(room)
                    send_json(self, {"ok": True, "poll": public_poll(room)})
                    return
                try:
                    choice = int(data.get("choice"))
                except (TypeError, ValueError):
                    send_json(self, {"ok": False, "error": "bad vote"}, 400)
                    return
                if choice < 0 or choice >= len(poll["options"]):
                    send_json(self, {"ok": False, "error": "bad choice"}, 400)
                    return
                poll["votes"][voter] = choice
                snapshot_poll(room)
                send_json(self, {"ok": True, "poll": public_poll(room)})
            return
        if path == "/api/host":
            if not authorised_host(self):
                send_json(self, {"ok": False, "error": "forbidden"}, 403)
                return
            action = str(data.get("action") or "")
            with LOCK:
                room = self.room_for(create=True)
                poll = room.poll
                if action == "start":
                    options = data.get("options") if isinstance(data.get("options"), list) else []
                    options = [str(x) for x in options][:8]
                    new_id = str(data.get("id") or "")[:40] or "poll"
                    kind = str(data.get("kind") or "choice")
                    kind = kind if kind in ("choice", "news2") else "choice"
                    if (
                        poll["revealed"]
                        and new_id == poll["id"]
                        and poll.get("kind") == kind
                        and poll["votes"]
                    ):
                        send_json(self, {"ok": True, "poll": public_poll(room, include_names=True)})
                        return
                    if new_id != poll["id"] or poll.get("kind") != kind:
                        snapshot_poll(room)
                        poll["votes"] = {}
                    poll["id"] = new_id
                    poll["kind"] = kind
                    poll["prompt"] = str(data.get("prompt") or "")[:400]
                    poll["options"] = options if kind == "choice" else []
                    correct = data.get("correct")
                    poll["correct"] = int(correct) if isinstance(correct, int) else None
                    poll["teach"] = str(data.get("teach") or "")[:1200]
                    if kind == "news2":
                        try:
                            poll["expectedTotal"] = int(data.get("expectedTotal"))
                        except (TypeError, ValueError):
                            poll["expectedTotal"] = None
                        try:
                            expected_scale = int(data.get("expectedScale"))
                        except (TypeError, ValueError):
                            expected_scale = 1
                        poll["expectedScale"] = expected_scale if expected_scale in (1, 2) else 1
                        obs = data.get("obs") if isinstance(data.get("obs"), dict) else {}
                        poll["obs"] = {str(k)[:24]: str(v)[:160] for k, v in list(obs.items())[:12]}
                    else:
                        poll["expectedTotal"] = None
                        poll["expectedScale"] = None
                        poll["obs"] = {}
                    poll["open"] = True
                    poll["revealed"] = False
                    room.register_open = False
                    room.feedback_open = False
                elif action == "reveal":
                    poll["revealed"] = True
                    poll["open"] = False
                    snapshot_poll(room)
                    room.register_open = False
                    room.feedback_open = False
                elif action == "idle":
                    snapshot_poll(room)
                    reset_poll(poll)
                    room.register_open = False
                    room.feedback_open = False
                elif action == "feedback":
                    snapshot_poll(room)
                    reset_poll(poll)
                    room.register_open = False
                    room.feedback_open = True
                elif action == "register":
                    snapshot_poll(room)
                    reset_poll(poll)
                    room.register_open = True
                    room.feedback_open = False
                send_json(self, {"ok": True, "poll": public_poll(room, include_names=True)})
            return
        send_json(self, {"ok": False, "error": "not found"}, 404)


class Server(ThreadingHTTPServer):
    allow_reuse_address = False
    request_queue_size = 128

    def server_bind(self) -> None:
        if os.name == "nt":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def main() -> None:
    global PORT
    if os.environ.get("PORT"):
        PORT = int(os.environ["PORT"])
    elif len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    try:
        server = Server(("0.0.0.0", PORT), partial(Handler, directory=str(ROOT)))
    except OSError as err:
        print("Could not listen on port {} ({}).".format(PORT, err), flush=True)
        print("Stop the other process using that port (often `python -m http.server {}`).".format(PORT), flush=True)
        sys.exit(1)
    cleared = clean_dev_scratch()
    ips = lan_ips()
    share, folder = attend_config()
    print()
    print("Hub CPD deck + live quiz", flush=True)
    if cleared:
        print("  Cleared leftover session files: {}".format(", ".join(cleared)), flush=True)
    print("  Home:       http://127.0.0.1:{}/".format(PORT), flush=True)
    print("  COPD:       http://127.0.0.1:{}/?course=copd&view=presenter".format(PORT), flush=True)
    print("  Heart Failure: http://127.0.0.1:{}/?course=hf&view=presenter".format(PORT), flush=True)
    if PRESENTERS:
        print("  Facilitator PINs (Hub staff type their own; they do not need Render):", flush=True)
        for pin, name in PRESENTERS.items():
            print("    {}  {}".format(pin, name or "(add their name in .env)"), flush=True)
    env = attend_env()
    flag = debug_flag(os.environ.get("DEBUG"))
    if flag is True:
        why = "DEBUG=true"
    elif flag is False:
        why = "DEBUG=false"
    else:
        why = "DEBUG is unset"
    print("  Workbooks: {} ({})".format("DEV" if env == "dev" else "LIVE", why), flush=True)
    if share:
        print("  Attendance: certificates/{{course}}/{}".format(env), flush=True)
        print("  OneDrive share must be the parent certificates folder, not certificates/dev or COPD/dev.", flush=True)
        for course in COURSES.values():
            print("    {}: {}".format(course["folder"], certificates_root() / course["folder"] / env), flush=True)
    elif folder:
        print("  Attendance: certificates/{{course}}/{}".format(env), flush=True)
        for course in COURSES.values():
            print("    {}: {}".format(course["folder"], certificates_root() / course["folder"] / env), flush=True)
    feedback_ready = [course["id"] for course in COURSES.values() if feedback_share_url(course["id"])]
    if feedback_ready:
        print("  Feedback workbooks: {}".format(", ".join(feedback_ready)), flush=True)
    if ips:
        print("  Room phones: http://{}:{}/v".format(ips[0], PORT), flush=True)
        for extra in ips[1:]:
            print("           also: http://{}:{}/v".format(extra, PORT), flush=True)
        print("  Phones: same Wi-Fi as this laptop, mobile data OFF, http not https.", flush=True)
    if PUBLIC_URL:
        print("  Teams join:  {}/v".format(PUBLIC_URL), flush=True)
        print("  Hosted presenter: {}/?view=presenter  (each facilitator uses their PIN)".format(PUBLIC_URL), flush=True)
    else:
        print("  Teams: share the Audience window. For remote voting, set PUBLIC_URL", flush=True)
        print("         to a public origin (cloudflared / Render) and restart.", flush=True)
        print("  Host token (if you open the deck via a LAN/public address): {}".format(HOST_TOKEN), flush=True)
    print()
    print("Ctrl+C to stop.", flush=True)
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
