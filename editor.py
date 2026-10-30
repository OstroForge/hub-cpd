"""Hub CPD slide editor.

Run from this project folder:

    python editor.py

Then open http://127.0.0.1:8766/ on this computer. The editor saves drafts
to OneDrive after Microsoft sign-in. It does not update hub-cpd.co.uk.
"""

from __future__ import annotations

import ast
import json
import mimetypes
import os
import re
import secrets
import hashlib
import base64
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EDITOR = ROOT / "editor"
LOCAL_ROOT = ROOT / "editor-drafts"
PORT = 8766
HOST = "127.0.0.1"
REDIRECT_URI = "http://127.0.0.1:%s/auth/callback" % PORT
GRAPH = "https://graph.microsoft.com/v1.0"
AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0"
SCOPES = "openid profile offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Files.ReadWrite"
DRAFTS = "CPD drafts"
PLACEHOLDER = (
    "/* No editor draft has been copied into this project yet.\n"
    "   The player uses slides.js until the editor copies a deck here. */\n"
)
COURSE_FILES = {
    "copd": ("copdDeckSlides", ROOT / "copd" / "deck.js", ROOT / "copd" / "slides.js"),
    "hf": ("heartFailureDeckSlides", ROOT / "hf" / "deck.js", ROOT / "hf" / "slides.js"),
    "asthma": ("asthmaDeckSlides", ROOT / "asthma" / "deck.js", ROOT / "asthma" / "slides.js"),
}
PENDING: dict[str, dict] = {}
PREVIEW_CSS: str | None = None
LOCK = threading.Lock()


def config_path() -> Path:
    return ROOT / "editor_config.json"


def load_config() -> dict:
    path = config_path()
    if not path.is_file():
        path = ROOT / "editor_config.example.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        data = {}
    if not isinstance(data, dict):
        data = {}
    return {
        "client_id": str(data.get("client_id") or "").strip(),
        "owner_email": str(data.get("owner_email") or "").strip().lower(),
    }


def save_config(client_id: str, owner_email: str) -> None:
    payload = {
        "client_id": client_id.strip(),
        "owner_email": owner_email.strip().lower(),
    }
    config_path().write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def token_path() -> Path:
    base = os.environ.get("LOCALAPPDATA") or str(Path.home())
    folder = Path(base) / "HubCpdEditor"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "token.json"


def load_token() -> dict | None:
    path = token_path()
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def save_token(data: dict) -> None:
    path = token_path()
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data), encoding="utf-8")
    tmp.replace(path)


def clear_token() -> None:
    try:
        token_path().unlink()
    except OSError:
        pass


class GraphError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status


def topic_catalog() -> list[dict]:
    """Topics defined on the site, including ones that are not published yet."""
    try:
        tree = ast.parse((ROOT / "serve.py").read_text(encoding="utf-8"))
    except (OSError, SyntaxError):
        return []
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(target, ast.Name) and target.id == "COURSES" for target in node.targets):
            continue
        try:
            raw = ast.literal_eval(node.value)
        except (ValueError, SyntaxError):
            return []
        topics = []
        if not isinstance(raw, dict):
            return []
        for key, item in raw.items():
            if not isinstance(item, dict):
                continue
            topic_id = str(item.get("id") or key).strip()
            folder = str(item.get("folder") or topic_id).strip()
            heading = str(item.get("home_heading") or item.get("title") or topic_id).strip()
            topics.append({
                "id": topic_id,
                "heading": heading,
                "folder": folder,
                "published": bool(item.get("published", True)),
            })
        return topics
    return []


def topic_for_name(name: str) -> dict | None:
    key = re.sub(r"\s+", " ", str(name or "")).strip().lower()
    if not key:
        return None
    for topic in topic_catalog():
        names = {topic["id"].lower(), topic["folder"].lower(), topic["heading"].lower()}
        if key in names:
            return topic
    return None


def canonical_topic_folder(name: str) -> str:
    topic = topic_for_name(name)
    if not topic:
        raise ValueError("That is not a topic on the site. Add the topic there before anyone can edit it.")
    folder = topic["folder"].strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 _.-]{0,80}", folder) or folder.lower() == DRAFTS.lower():
        raise ValueError("That topic folder name is not allowed")
    return folder


def guess_course(name: str) -> str:
    topic = topic_for_name(name)
    return topic["id"] if topic else ""


def path_is_drafts(path: str) -> bool:
    norm = path.replace("\\", "/").rstrip("/").lower()
    return norm.endswith("/" + DRAFTS.lower()) or norm.endswith("root:/" + DRAFTS.lower())


def safe_name(name: str) -> str:
    base = Path(str(name or "")).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "-", base).strip(".-")
    if not cleaned or cleaned.lower() in {"deck.json"}:
        raise ValueError("Choose an image file name")
    return cleaned[:80]


def onedrive_bases() -> list[Path]:
    found = []
    seen = set()

    def add(raw: str | None) -> None:
        if not raw:
            return
        path = Path(raw)
        if not path.is_dir():
            return
        try:
            key = str(path.resolve()).lower()
        except OSError:
            return
        if key in seen:
            return
        seen.add(key)
        found.append(path.resolve())

    for key in ("OneDriveConsumer", "OneDrive", "OneDriveCommercial"):
        add(os.environ.get(key))
    home = Path.home()
    try:
        children = list(home.iterdir())
    except OSError:
        children = []
    for child in children:
        if child.is_dir() and "onedrive" in child.name.lower():
            add(str(child))
    return found


def pc_drafts_root() -> Path:
    """Session folders live in editor-drafts, inside this project. The project is in OneDrive, so those folders sync from there."""
    LOCAL_ROOT.mkdir(parents=True, exist_ok=True)
    return LOCAL_ROOT.resolve()


def local_dir(name: str) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 _.-]{0,80}", name or ""):
        raise ValueError("Folder name is not allowed")
    if name.strip().lower() == DRAFTS.lower():
        raise ValueError("Use a session name, such as COPD")
    root = LOCAL_ROOT.resolve()
    path = (root / name).resolve()
    if path.parent != root:
        raise ValueError("Folder name is not allowed")
    return path


def project_ready() -> bool:
    return all(item[2].is_file() for item in COURSE_FILES.values())


def imports_available() -> list[str]:
    return [key for key, item in COURSE_FILES.items() if item[2].is_file()]


def draft_is_live(course: str) -> bool:
    info = COURSE_FILES.get(course)
    if not info or not info[1].is_file():
        return False
    try:
        return "function " in info[1].read_text(encoding="utf-8")
    except OSError:
        return False


THEMES = ("copd", "hf", "asthma", "clay", "tide", "plum")


def deck_js(course: str, slides: list, theme: str = "") -> str:
    fn = COURSE_FILES[course][0]
    theme = str(theme or "")
    if theme not in THEMES and theme != "":
        raise ValueError("Unknown colour theme")
    payload = json.dumps(slides, ensure_ascii=False, indent=2)
    payload = payload.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029").replace("</", "<\\/")
    script = "function %s() {\n  return %s;\n}\n" % (fn, payload)
    if theme:
        script += "function %s() {\n  return %s;\n}\n" % (fn.replace("Slides", "Theme"), json.dumps(theme))
    return script


def write_project_deck(course: str, slides: list, theme: str = "") -> None:
    if course not in COURSE_FILES:
        raise ValueError("This session cannot be copied into the project")
    if not isinstance(slides, list) or not slides:
        raise ValueError("The deck has no slides")
    if any(not isinstance(slide, dict) for slide in slides):
        raise ValueError("A slide could not be read")
    dest = COURSE_FILES[course][1]
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".js.tmp")
    tmp.write_text(deck_js(course, slides, theme), encoding="utf-8")
    tmp.replace(dest)


def restore_project_deck(course: str) -> None:
    if course not in COURSE_FILES:
        raise ValueError("Unknown session")
    dest = COURSE_FILES[course][1]
    dest.write_text(PLACEHOLDER, encoding="utf-8")


def preview_css() -> str:
    global PREVIEW_CSS
    if PREVIEW_CSS is not None:
        return PREVIEW_CSS
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    start = text.find("<style>")
    end = text.find("</style>", start)
    if start < 0 or end < 0:
        css = ""
    else:
        css = text[start + len("<style>"):end]
    PREVIEW_CSS = css + """
      html, body { height: 100%; overflow: hidden; }
      .stage { height: 100% !important; padding: 0 !important; }
    """
    return PREVIEW_CSS


def static_file(url_path: str) -> Path | None:
    rel = urllib.parse.unquote(url_path.split("?", 1)[0]).lstrip("/")
    if not rel:
        return None
    parts = Path(rel).parts
    if ".." in parts or any(part.startswith(".") for part in parts):
        return None
    if any(part.startswith(".env") or part in {"editor_config.json", ".git"} for part in parts):
        return None
    path = (ROOT / rel).resolve()
    if path != ROOT and ROOT not in path.parents:
        return None
    if not path.is_file():
        return None
    if path.suffix.lower() in {".py", ".pem", ".key"}:
        return None
    return path


def editor_file(name: str) -> Path | None:
    mapping = {
        "/": "index.html",
        "/index.html": "index.html",
        "/app.js": "app.js",
        "/deck.js": "deck.js",
        "/layouts.js": "layouts.js",
        "/editor.css": "editor.css",
        "/preview.html": "preview.html",
    }
    filename = mapping.get(name)
    if not filename:
        return None
    path = (EDITOR / filename).resolve()
    if EDITOR not in path.parents or not path.is_file():
        return None
    return path


def pkce() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return verifier, challenge


def form_post(url: str, fields: dict) -> dict:
    data = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            body = res.read()
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            payload = {}
        message = payload.get("error_description") or payload.get("error") or err.reason
        raise GraphError(err.code, str(message)) from err
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as err:
        raise GraphError(502, "Microsoft returned an unreadable sign-in response") from err
    if not isinstance(payload, dict):
        raise GraphError(502, "Microsoft returned an unreadable sign-in response")
    return payload


def graph_call(method: str, url: str, body: bytes | None = None, content_type: str | None = None, retry: bool = True) -> tuple[int, bytes, str]:
    token = ensure_access_token()
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "Bearer " + token)
    if content_type:
        req.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.status, res.read(), res.headers.get("Content-Type", "")
    except urllib.error.HTTPError as err:
        raw = err.read()
        if err.code == 401 and retry:
            force_refresh()
            return graph_call(method, url, body, content_type, retry=False)
        message = graph_message(raw) or err.reason or "OneDrive refused the request"
        raise GraphError(err.code, message) from err
    except urllib.error.URLError as err:
        raise GraphError(502, "Could not reach Microsoft") from err


def graph_message(raw: bytes) -> str:
    try:
        payload = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return ""
    if not isinstance(payload, dict):
        return ""
    error = payload.get("error")
    if isinstance(error, dict):
        return str(error.get("message") or "")
    return str(error or "")


def store_token_response(payload: dict, previous: dict | None = None) -> dict:
    access = str(payload.get("access_token") or "")
    if not access:
        raise GraphError(401, "Microsoft did not return a sign-in")
    refresh = str(payload.get("refresh_token") or (previous or {}).get("refresh_token") or "")
    expires = time.time() + int(payload.get("expires_in") or 3600) - 60
    data = {"access_token": access, "refresh_token": refresh, "expires_at": expires}
    save_token(data)
    return data


def force_refresh() -> None:
    current = load_token() or {}
    refresh = str(current.get("refresh_token") or "")
    client_id = load_config()["client_id"]
    if not refresh or not client_id:
        clear_token()
        raise GraphError(401, "Sign in again")
    payload = form_post(AUTH + "/token", {
        "client_id": client_id,
        "grant_type": "refresh_token",
        "refresh_token": refresh,
        "scope": SCOPES,
        "redirect_uri": REDIRECT_URI,
    })
    store_token_response(payload, current)


def ensure_access_token() -> str:
    with LOCK:
        current = load_token()
        if not current or not current.get("access_token"):
            raise GraphError(401, "Sign in again")
        if float(current.get("expires_at") or 0) > time.time():
            return str(current["access_token"])
        refresh = str(current.get("refresh_token") or "")
        client_id = load_config()["client_id"]
        if not refresh or not client_id:
            clear_token()
            raise GraphError(401, "Sign in again")
        payload = form_post(AUTH + "/token", {
            "client_id": client_id,
            "grant_type": "refresh_token",
            "refresh_token": refresh,
            "scope": SCOPES,
            "redirect_uri": REDIRECT_URI,
        })
        data = store_token_response(payload, current)
        return str(data["access_token"])


def graph_json(method: str, url: str, payload: dict | None = None) -> tuple[int, dict]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    content = None if payload is None else "application/json"
    status, raw, _kind = graph_call(method, url, body, content)
    if not raw:
        return status, {}
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as err:
        raise GraphError(502, "OneDrive returned an unreadable response") from err
    return status, data if isinstance(data, dict) else {}


def current_user() -> dict | None:
    if not load_token():
        return None
    try:
        _status, me = graph_json("GET", GRAPH + "/me?$select=displayName,mail,userPrincipalName")
    except GraphError:
        return None
    emails = []
    for key in ("mail", "userPrincipalName"):
        value = str(me.get(key) or "").split("#", 1)[0].strip().lower()
        if "@" in value and value not in emails:
            emails.append(value)
    email = emails[0] if emails else ""
    return {
        "name": str(me.get("displayName") or email or "Signed in"),
        "email": email,
        "emails": emails,
    }


def is_owner(me: dict | None) -> bool:
    owner = load_config()["owner_email"]
    if not me or not owner:
        return False
    return owner in set(me.get("emails") or [])


def public_user(me: dict | None) -> dict | None:
    if not me:
        return None
    return {"name": me.get("name") or "", "email": me.get("email") or ""}


def folder_record(name: str, drive_id: str, item_id: str) -> dict:
    return {
        "name": name,
        "driveId": drive_id,
        "itemId": item_id,
        "course": guess_course(name),
    }


def disk_path(drive_id: str, item_id: str) -> Path:
    if drive_id == "local":
        return local_dir(item_id)
    if drive_id != "path":
        raise ValueError("Unknown folder")
    path = Path(item_id).resolve()
    if not path.is_dir():
        raise ValueError("That folder is not on this computer")
    bases = onedrive_bases()
    if not any(path == base or base in path.parents for base in bases):
        raise ValueError("Choose a folder inside OneDrive")
    if path in bases:
        raise ValueError("Open a session folder, such as COPD")
    return path


def list_pc_folders() -> list[dict]:
    found = []
    seen = set()

    def add(path: Path) -> None:
        try:
            key = str(path.resolve()).lower()
        except OSError:
            return
        if key in seen or not path.is_dir() or path.name.startswith("."):
            return
        seen.add(key)
        found.append(folder_record(path.name, "path", str(path.resolve())))

    root = pc_drafts_root()
    if root.is_dir():
        for child in sorted(root.iterdir(), key=lambda item: item.name.lower()):
            add(child)
    for base in onedrive_bases():
        try:
            children = list(base.iterdir())
        except OSError:
            continue
        for child in sorted(children, key=lambda item: item.name.lower()):
            if (child / "deck.json").is_file():
                add(child)
    found.sort(key=lambda item: item["name"].lower())
    return found


def create_pc_folder(name: str) -> dict:
    cleaned = canonical_topic_folder(name)
    root = pc_drafts_root()
    root.mkdir(parents=True, exist_ok=True)
    path = (root / cleaned).resolve()
    if path.parent != root:
        raise ValueError("Choose a session name such as COPD")
    path.mkdir(exist_ok=True)
    return folder_record(path.name, "path", str(path))


def list_local_folders() -> list[dict]:
    if not LOCAL_ROOT.is_dir():
        return []
    found = []
    for path in sorted(LOCAL_ROOT.iterdir(), key=lambda item: item.name.lower()):
        if path.is_dir() and not path.name.startswith("."):
            found.append(folder_record(path.name, "local", path.name))
    return found


def create_local_folder(name: str) -> dict:
    path = local_dir(canonical_topic_folder(name))
    path.mkdir(parents=True, exist_ok=True)
    return folder_record(path.name, "local", path.name)


def read_disk_deck(drive_id: str, item_id: str) -> dict | None:
    path = disk_path(drive_id, item_id) / "deck.json"
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return validate_deck(data)


def write_disk_deck(drive_id: str, item_id: str, deck: dict, email: str) -> dict:
    deck = validate_deck(deck)
    folder = disk_path(drive_id, item_id)
    folder.mkdir(parents=True, exist_ok=True)
    deck["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    deck["updatedBy"] = email or "this computer"
    (folder / "deck.json").write_text(json.dumps(deck, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return deck


TITLE_SUFFIXES = {".png", ".jpg", ".webp", ".gif"}


def title_slide_name(original: str) -> str:
    ext = Path(str(original or "")).suffix.lower()
    if ext == ".jpeg":
        ext = ".jpg"
    if ext not in TITLE_SUFFIXES:
        raise ValueError("Use a PNG, JPG, WEBP or GIF for the title picture")
    return "title-slide" + ext


def forget_other_title_slides(folder: Path, keep: str) -> None:
    if not folder.is_dir():
        return
    for path in folder.iterdir():
        if path.is_file() and path.name.startswith("title-slide.") and path.name != keep:
            path.unlink()


def disk_asset(drive_id: str, item_id: str, filename: str) -> Path:
    folder = (disk_path(drive_id, item_id) / "assets").resolve()
    folder.mkdir(parents=True, exist_ok=True)
    dest = (folder / safe_name(filename)).resolve()
    if dest.parent != folder:
        raise ValueError("Image name is not allowed")
    return dest


def read_local_deck(name: str) -> dict | None:
    path = local_dir(name) / "deck.json"
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return validate_deck(data)


def write_local_deck(name: str, deck: dict, email: str) -> dict:
    deck = validate_deck(deck)
    path = local_dir(name)
    path.mkdir(parents=True, exist_ok=True)
    deck["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    deck["updatedBy"] = email or "this computer"
    (path / "deck.json").write_text(json.dumps(deck, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return deck


def local_asset(name: str, filename: str) -> Path:
    folder = local_dir(name) / "assets"
    folder.mkdir(parents=True, exist_ok=True)
    dest = (folder / safe_name(filename)).resolve()
    if dest.parent != folder.resolve():
        raise ValueError("Image name is not allowed")
    return dest


def find_drafts_folder() -> dict | None:
    try:
        _status, data = graph_json("GET", GRAPH + "/me/drive/root:/" + urllib.parse.quote(DRAFTS))
    except GraphError as err:
        if err.status == 404:
            return None
        raise
    return data if data.get("id") else None


def ensure_drafts_folder() -> dict:
    found = find_drafts_folder()
    if found:
        return found
    try:
        _status, created = graph_json("POST", GRAPH + "/me/drive/root/children", {
            "name": DRAFTS,
            "folder": {},
            "@microsoft.graph.conflictBehavior": "fail",
        })
    except GraphError as err:
        if err.status != 409:
            raise
        found = find_drafts_folder()
        if found:
            return found
        raise
    if not created.get("id"):
        raise GraphError(502, "Could not create the CPD drafts folder")
    return created


def list_children(drive_id: str, item_id: str) -> list[dict]:
    if drive_id:
        url = GRAPH + "/drives/%s/items/%s/children" % (
            urllib.parse.quote(drive_id),
            urllib.parse.quote(item_id),
        )
    else:
        url = GRAPH + "/me/drive/items/%s/children" % urllib.parse.quote(item_id)
    found = []
    while url:
        _status, data = graph_json("GET", url)
        for item in data.get("value") or []:
            if isinstance(item, dict):
                found.append(item)
        url = str(data.get("@odata.nextLink") or "")
    return found


def list_onedrive_folders(me: dict) -> list[dict]:
    found = []
    seen = set()

    def add(name: str, drive_id: str, item_id: str) -> None:
        if not name or not drive_id or not item_id or item_id in seen:
            return
        if name.lower() == DRAFTS.lower():
            return
        seen.add(item_id)
        found.append(folder_record(name, drive_id, item_id))

    if is_owner(me):
        parent = find_drafts_folder()
        if parent:
            drive_id = str((parent.get("parentReference") or {}).get("driveId") or "")
            for item in list_children(drive_id, parent["id"]):
                if "folder" in item:
                    parent_ref = item.get("parentReference") or {}
                    add(str(item.get("name") or ""), str(parent_ref.get("driveId") or drive_id), str(item.get("id") or ""))

    url = GRAPH + "/me/drive/sharedWithMe"
    while url:
        _status, data = graph_json("GET", url)
        for item in data.get("value") or []:
            if not isinstance(item, dict):
                continue
            remote = item.get("remoteItem") or {}
            parent = (remote.get("parentReference") or {}).get("path") or ""
            name = str(remote.get("name") or item.get("name") or "")
            drive_id = str((remote.get("parentReference") or {}).get("driveId") or "")
            item_id = str(remote.get("id") or "")
            if "folder" not in remote or not drive_id or not item_id:
                continue
            if name.lower() == DRAFTS.lower():
                for child in list_children(drive_id, item_id):
                    if "folder" in child:
                        ref = child.get("parentReference") or {}
                        add(str(child.get("name") or ""), str(ref.get("driveId") or ""), str(child.get("id") or ""))
                continue
            if path_is_drafts(parent):
                add(name, drive_id, item_id)
        url = str(data.get("@odata.nextLink") or "")
    found.sort(key=lambda item: item["name"].lower())
    return found


def create_onedrive_folder(name: str) -> dict:
    cleaned = canonical_topic_folder(name)
    parent = ensure_drafts_folder()
    drive_id = str((parent.get("parentReference") or {}).get("driveId") or "")
    if not drive_id:
        _status, drive = graph_json("GET", GRAPH + "/me/drive?$select=id")
        drive_id = str(drive.get("id") or "")
    try:
        _status, created = graph_json(
            "POST",
            GRAPH + "/drives/%s/items/%s/children" % (urllib.parse.quote(drive_id), urllib.parse.quote(parent["id"])),
            {"name": cleaned, "folder": {}, "@microsoft.graph.conflictBehavior": "fail"},
        )
    except GraphError as err:
        if err.status == 409:
            raise GraphError(409, "A folder with that name already exists") from err
        raise
    ref = created.get("parentReference") or {}
    return folder_record(str(created.get("name") or cleaned), str(ref.get("driveId") or drive_id), str(created.get("id") or ""))


def drive_file_url(drive_id: str, item_id: str, filename: str) -> str:
    return GRAPH + "/drives/%s/items/%s:/%s:/content" % (
        urllib.parse.quote(drive_id),
        urllib.parse.quote(item_id),
        urllib.parse.quote(filename),
    )


def read_onedrive_deck(drive_id: str, item_id: str) -> dict | None:
    try:
        status, raw, _kind = graph_call("GET", drive_file_url(drive_id, item_id, "deck.json"))
    except GraphError as err:
        if err.status == 404:
            return None
        raise
    if status == 404 or not raw:
        return None
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as err:
        raise GraphError(422, "The deck file in this folder could not be read") from err
    return validate_deck(data)


def write_onedrive_deck(drive_id: str, item_id: str, deck: dict, email: str) -> dict:
    deck = validate_deck(deck)
    deck["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    deck["updatedBy"] = email or ""
    raw = (json.dumps(deck, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError("This deck is too large to save")
    graph_call("PUT", drive_file_url(drive_id, item_id, "deck.json"), raw, "application/json")
    return deck


def validate_deck(deck: dict) -> dict:
    if not isinstance(deck, dict) or deck.get("kind") != "hub-cpd-deck":
        raise ValueError("This file is not a Hub CPD deck")
    if not isinstance(deck.get("slides"), list):
        raise ValueError("This deck has no slides")
    return deck


def validate_ids(drive_id: str, item_id: str) -> None:
    if drive_id in {"local", "path"}:
        disk_path(drive_id, item_id)
        return
    if not drive_id or not item_id or "/" in drive_id or "/" in item_id or ".." in drive_id or ".." in item_id:
        raise ValueError("Unknown folder")


def copy_uploads(course: str, drive_id: str, item_id: str, names: list) -> None:
    if course not in COURSE_FILES:
        return
    dest_root = ROOT / course / "assets"
    dest_root.mkdir(parents=True, exist_ok=True)
    for name in names:
        filename = safe_name(str(name))
        dest = (dest_root / filename).resolve()
        if dest.parent != dest_root.resolve():
            raise ValueError("Image name is not allowed")
        if drive_id in {"local", "path"}:
            src = disk_asset(drive_id, item_id, filename)
            if not src.is_file():
                raise ValueError("Missing image: " + filename)
            dest.write_bytes(src.read_bytes())
            continue
        validate_ids(drive_id, item_id)
        _status, raw, _kind = graph_call("GET", drive_file_url(drive_id, item_id, "assets/" + filename))
        dest.write_bytes(raw)


def mime_for(path: Path) -> str:
    kind, _enc = mimetypes.guess_type(path.name)
    return kind or "application/octet-stream"


class Handler(BaseHTTPRequestHandler):
    timeout = 90

    def log_message(self, fmt: str, *args) -> None:
        path = urllib.parse.urlparse(self.path).path
        if path.startswith("/api/") or path.startswith("/auth/"):
            return
        super().log_message(fmt, *args)

    def do_GET(self) -> None:
        try:
            self.route_get()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, TimeoutError):
            return
        except GraphError as err:
            self.send_json({"error": str(err)}, 401 if err.status == 401 else 400)
        except ValueError as err:
            self.send_json({"error": str(err)}, 400)
        except Exception:
            import traceback
            traceback.print_exc()
            self.send_json({"error": "The editor hit a problem reading that request"}, 500)

    def do_POST(self) -> None:
        try:
            self.route_post()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, TimeoutError):
            return
        except GraphError as err:
            self.send_json({"error": str(err)}, 401 if err.status == 401 else 400)
        except ValueError as err:
            self.send_json({"error": str(err)}, 400)
        except Exception:
            import traceback
            traceback.print_exc()
            self.send_json({"error": "The editor hit a problem saving that request"}, 500)

    def route_get(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        if path == "/auth/start":
            self.start_login()
            return
        if path == "/auth/callback":
            self.finish_login(query)
            return
        if path == "/api/status":
            self.send_json(self.status_payload())
            return
        if path == "/api/folders":
            self.send_json({"folders": self.folders_for(query.get("source", ["onedrive"])[0])})
            return
        if path == "/api/deck":
            drive_id = query.get("driveId", [""])[0]
            item_id = query.get("itemId", [""])[0]
            validate_ids(drive_id, item_id)
            deck = read_disk_deck(drive_id, item_id) if drive_id in {"local", "path"} else read_onedrive_deck(drive_id, item_id)
            self.send_json({"deck": deck})
            return
        if path == "/media":
            self.send_media(query.get("driveId", [""])[0], query.get("itemId", [""])[0], query.get("name", [""])[0])
            return
        if path == "/preview.css":
            body = preview_css().encode("utf-8")
            self.send_bytes(body, "text/css; charset=utf-8")
            return
        editor = editor_file(path)
        if editor is not None:
            self.send_file(editor)
            return
        found = static_file(path)
        if found is not None:
            self.send_file(found)
            return
        self.send_error(404, "Not found")

    def route_post(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path == "/api/config":
            data = self.read_json()
            client_id = str(data.get("clientId") or "").strip()
            owner = str(data.get("ownerEmail") or "").strip().lower()
            if not re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", client_id):
                raise ValueError("Paste the Application (client) ID from Microsoft")
            if "@" not in owner:
                raise ValueError("Enter the Microsoft email that owns the OneDrive folders")
            save_config(client_id, owner)
            self.send_json({"ok": True})
            return
        if path == "/api/logout":
            clear_token()
            self.send_json({"ok": True})
            return
        if path == "/api/folders":
            data = self.read_json()
            source = str(data.get("source") or "")
            name = str(data.get("name") or "")
            if source == "local":
                self.send_json({"folder": create_local_folder(name)})
                return
            if source == "pc":
                self.send_json({"folder": create_pc_folder(name)})
                return
            me = self.require_user()
            if not is_owner(me):
                raise GraphError(403, "Only the OneDrive owner can create a session folder")
            self.send_json({"folder": create_onedrive_folder(name)})
            return
        if path == "/api/deck":
            data = self.read_json()
            drive_id = str(data.get("driveId") or "")
            item_id = str(data.get("itemId") or "")
            validate_ids(drive_id, item_id)
            deck = data.get("deck")
            if drive_id in {"local", "path"}:
                saved = write_disk_deck(drive_id, item_id, deck, "this computer")
            else:
                me = self.require_user()
                saved = write_onedrive_deck(drive_id, item_id, deck, me.get("email") or "")
            self.send_json({"ok": True, "deck": saved})
            return
        if path == "/api/asset":
            self.save_asset()
            return
        if path == "/api/title-image":
            self.clear_title_image()
            return
        if path == "/api/project":
            data = self.read_json()
            course = str(data.get("course") or "")
            drive_id = str(data.get("driveId") or "")
            item_id = str(data.get("itemId") or "")
            slides = data.get("slides")
            uploads = data.get("uploads") if isinstance(data.get("uploads"), list) else []
            if not project_ready():
                raise ValueError("Open the editor from the Hub CPD project folder to copy a deck in")
            self.require_project_write(drive_id)
            validate_ids(drive_id, item_id)
            copy_uploads(course, drive_id, item_id, uploads)
            write_project_deck(course, slides, str(data.get("theme") or ""))
            self.send_json({"ok": True, "live": True})
            return
        if path == "/api/project-restore":
            data = self.read_json()
            self.require_project_write(str(data.get("driveId") or ""))
            restore_project_deck(str(data.get("course") or ""))
            self.send_json({"ok": True, "live": False})
            return
        self.send_error(404, "Not found")

    def status_payload(self) -> dict:
        cfg = load_config()
        me = current_user() if cfg["client_id"] and load_token() else None
        return {
            "configured": bool(cfg["client_id"] and cfg["owner_email"]),
            "onedrive": str(pc_drafts_root()),
            "redirectUri": REDIRECT_URI,
            "signedIn": bool(me),
            "user": public_user(me),
            "owner": is_owner(me),
            "project": project_ready(),
            "imports": imports_available(),
            "topics": topic_catalog(),
            "published": {key: draft_is_live(key) for key in COURSE_FILES},
        }

    def folders_for(self, source: str) -> list[dict]:
        if source == "local":
            return list_local_folders()
        if source == "pc":
            return list_pc_folders()
        me = self.require_user()
        return list_onedrive_folders(me)

    def require_project_write(self, drive_id: str) -> None:
        if drive_id in {"local", "path"}:
            return
        me = self.require_user()
        if not is_owner(me):
            raise GraphError(403, "Only the OneDrive owner can copy a deck into this project")

    def require_user(self) -> dict:
        if not load_config()["client_id"]:
            raise GraphError(401, "Save the Microsoft application ID first")
        me = current_user()
        if not me:
            raise GraphError(401, "Sign in again")
        return me

    def start_login(self) -> None:
        cfg = load_config()
        if not cfg["client_id"]:
            self.redirect("/?auth_error=" + urllib.parse.quote("Save the Microsoft application ID first"))
            return
        verifier, challenge = pkce()
        state = secrets.token_urlsafe(24)
        now = time.time()
        with LOCK:
            for key, item in list(PENDING.items()):
                if now - float(item.get("at") or 0) > 600:
                    PENDING.pop(key, None)
            PENDING[state] = {"verifier": verifier, "at": now}
        params = urllib.parse.urlencode({
            "client_id": cfg["client_id"],
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "response_mode": "query",
            "scope": SCOPES,
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "prompt": "select_account",
        })
        self.redirect(AUTH + "/authorize?" + params)

    def finish_login(self, query: dict[str, list[str]]) -> None:
        if query.get("error"):
            message = query.get("error_description", query.get("error", ["Microsoft refused the sign-in"]))[0]
            self.redirect("/?auth_error=" + urllib.parse.quote(message[:300]))
            return
        state = (query.get("state") or [""])[0]
        code = (query.get("code") or [""])[0]
        with LOCK:
            pending = PENDING.pop(state, None)
        if not pending or not code:
            self.redirect("/?auth_error=" + urllib.parse.quote("Sign-in expired. Try again."))
            return
        try:
            payload = form_post(AUTH + "/token", {
                "client_id": load_config()["client_id"],
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "code_verifier": pending["verifier"],
                "scope": SCOPES,
            })
            store_token_response(payload)
        except GraphError as err:
            self.redirect("/?auth_error=" + urllib.parse.quote(str(err)[:300]))
            return
        self.redirect("/")

    def save_asset(self) -> None:
        drive_id = self.headers.get("X-Drive-Id") or ""
        item_id = self.headers.get("X-Item-Id") or ""
        original = self.headers.get("X-Filename") or ""
        role = (self.headers.get("X-Role") or "").strip().lower()
        filename = title_slide_name(original) if role == "title" else safe_name(original)
        raw = self.read_body(8 * 1024 * 1024)
        if not raw:
            raise ValueError("That image was empty")
        validate_ids(drive_id, item_id)
        if drive_id in {"local", "path"}:
            dest = disk_asset(drive_id, item_id, filename)
            dest.write_bytes(raw)
            if role == "title":
                forget_other_title_slides(dest.parent, filename)
        else:
            self.require_user()
            self.ensure_assets(drive_id, item_id)
            graph_call("PUT", drive_file_url(drive_id, item_id, "assets/" + filename), raw, mime_for(Path(filename)))
            if role == "title":
                self.forget_graph_title_slides(drive_id, item_id, filename)
        self.send_json({"image": "upload:" + filename})

    def clear_title_image(self) -> None:
        data = self.read_json()
        drive_id = str(data.get("driveId") or "")
        item_id = str(data.get("itemId") or "")
        validate_ids(drive_id, item_id)
        if drive_id in {"local", "path"}:
            forget_other_title_slides(disk_path(drive_id, item_id) / "assets", "")
        else:
            self.require_user()
            self.forget_graph_title_slides(drive_id, item_id, "")
        self.send_json({"ok": True})

    def forget_graph_title_slides(self, drive_id: str, item_id: str, keep: str) -> None:
        assets_id = ""
        for item in list_children(drive_id, item_id):
            if str(item.get("name") or "").lower() == "assets" and "folder" in item:
                assets_id = str(item.get("id") or "")
                break
        if not assets_id:
            return
        for item in list_children(drive_id, assets_id):
            name = str(item.get("name") or "")
            item_key = str(item.get("id") or "")
            if "folder" in item or not item_key or not name.startswith("title-slide.") or name == keep:
                continue
            graph_call(
                "DELETE",
                GRAPH + "/drives/%s/items/%s" % (urllib.parse.quote(drive_id), urllib.parse.quote(item_key)),
            )

    def send_media(self, drive_id: str, item_id: str, name: str) -> None:
        filename = safe_name(name)
        validate_ids(drive_id, item_id)
        if drive_id in {"local", "path"}:
            path = disk_asset(drive_id, item_id, filename)
            if not path.is_file():
                self.send_error(404, "Not found")
                return
            self.send_file(path)
            return
        self.require_user()
        _status, raw, kind = graph_call("GET", drive_file_url(drive_id, item_id, "assets/" + filename))
        self.send_bytes(raw, kind.split(";")[0] or mime_for(Path(filename)))

    def ensure_assets(self, drive_id: str, item_id: str) -> None:
        for item in list_children(drive_id, item_id):
            if str(item.get("name") or "").lower() == "assets" and "folder" in item:
                return
        graph_json(
            "POST",
            GRAPH + "/drives/%s/items/%s/children" % (urllib.parse.quote(drive_id), urllib.parse.quote(item_id)),
            {"name": "assets", "folder": {}, "@microsoft.graph.conflictBehavior": "fail"},
        )

    def read_body(self, limit: int) -> bytes:
        length = int(self.headers.get("Content-Length") or "0")
        if length < 0 or length > limit:
            raise ValueError("That upload is too large")
        return self.rfile.read(length) if length else b""

    def read_json(self) -> dict:
        raw = self.read_body(8 * 1024 * 1024)
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError as err:
            raise ValueError("The editor sent an unreadable change") from err
        if not isinstance(data, dict):
            raise ValueError("The editor sent an unreadable change")
        return data

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_bytes(body, "application/json; charset=utf-8", status)

    def send_file(self, path: Path) -> None:
        self.send_bytes(path.read_bytes(), mime_for(path) + ("; charset=utf-8" if path.suffix in {".js", ".css", ".html"} else ""))

    def send_bytes(self, body: bytes, content_type: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location: str) -> None:
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()


def check() -> None:
    assert path_is_drafts("/drives/abc/root:/CPD drafts")
    assert path_is_drafts("/drive/root:/Work/CPD drafts")
    assert not path_is_drafts("/drives/abc/root:/Documents")
    assert static_file("/.env") is None
    assert static_file("/editor_config.json") is None
    assert static_file("/editor.py") is None
    js = deck_js("copd", [{"html": "<div></div>", "notes": "a</script>b"}])
    assert js.startswith("function copdDeckSlides()")
    assert "DeckTheme" not in js
    assert "<\\/" in js
    themed = deck_js("hf", [{"html": "<div></div>"}], "clay")
    assert "function heartFailureDeckTheme()" in themed
    assert '"clay"' in themed
    try:
        deck_js("copd", [{"html": "<div></div>"}], "nope")
    except ValueError:
        pass
    else:
        raise SystemExit("theme check failed")
    css = preview_css()
    assert ".slide" in css
    assert "theme-clay" in css and "theme-tide" in css and "theme-plum" in css
    topics = topic_catalog()
    assert any(item["id"] == "copd" and item["published"] for item in topics)
    assert any(item["id"] == "hf" and not item["published"] for item in topics)
    assert guess_course("Heart Failure") == "hf"
    assert title_slide_name("Ward photo.JPEG") == "title-slide.jpg"
    assert title_slide_name("night.png") == "title-slide.png"
    try:
        title_slide_name("notes.txt")
    except ValueError:
        pass
    else:
        raise SystemExit("title picture type check failed")
    assert guess_course("sepsis") == ""
    try:
        canonical_topic_folder("Sepsis")
    except ValueError:
        pass
    else:
        raise SystemExit("new topic names must be added on the site first")
    try:
        local_dir("../secrets")
    except ValueError:
        pass
    else:
        raise SystemExit("local folder check failed")
    print("editor check ok")


def main() -> None:
    import sys
    if "--check" in sys.argv:
        check()
        return
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = "http://%s:%s/" % (HOST, PORT)
    print("Hub CPD editor")
    print("  Open:        " + url)
    print("  Sign-in URL: " + REDIRECT_URI)
    print("  Drafts stay in OneDrive. This does not update hub-cpd.co.uk.")
    print("  Stop with Ctrl+C.")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
