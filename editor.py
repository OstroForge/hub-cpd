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
import shutil
import sys
import hashlib
import base64
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def bundle_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent


def shared_mode() -> bool:
    """The installed editor opens shared session folders only. It cannot publish."""
    return bool(getattr(sys, "frozen", False) or "--shared" in sys.argv)


ROOT = bundle_root()
EDITOR = ROOT / "editor"
LOCAL_ROOT = ROOT / "editor-drafts"
PORT = 8766
HOST = "127.0.0.1"
EDITOR_BUILD = 7
APP_VERSION = "1.0.0"
CONTACT_EMAIL = "info@hub-cpd.co.uk"
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
    "stroke": ("strokeDeckSlides", ROOT / "stroke" / "deck.js", ROOT / "stroke" / "slides.js"),
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


def topics_from_bundle() -> list[dict]:
    path = EDITOR / "topics.json"
    if not path.is_file():
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(raw, list):
        return []
    topics = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        topic_id = str(item.get("id") or "").strip()
        if not topic_id:
            continue
        topics.append({
            "id": topic_id,
            "heading": str(item.get("heading") or topic_id).strip(),
            "folder": str(item.get("folder") or topic_id).strip(),
            "published": bool(item.get("published", True)),
        })
    return topics


def topic_catalog() -> list[dict]:
    """Topics defined on the site, including ones that are not published yet."""
    try:
        tree = ast.parse((ROOT / "serve.py").read_text(encoding="utf-8"))
    except (OSError, SyntaxError):
        return topics_from_bundle()
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(target, ast.Name) and target.id == "COURSES" for target in node.targets):
            continue
        try:
            raw = ast.literal_eval(node.value)
        except (ValueError, SyntaxError):
            return topics_from_bundle()
        topics = []
        if not isinstance(raw, dict):
            return topics_from_bundle()
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
        return topics or topics_from_bundle()
    return topics_from_bundle()


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


def inside_onedrive(path: Path) -> bool:
    bases = onedrive_bases()
    candidates = [path]
    try:
        resolved = path.resolve()
    except OSError:
        resolved = None
    if resolved is not None and resolved not in candidates:
        candidates.append(resolved)
    for candidate in candidates:
        for base in bases:
            if candidate == base or base in candidate.parents:
                return True
    return False


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


DRAFT_WALK = {"cursor projects", "cpd", "copd", "hub-cpd", "editor-drafts"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}


def list_shared_folders(roots: list[Path] | None = None) -> list[dict]:
    """Shared shortcuts at the top of OneDrive, plus sessions this computer already owns."""
    bases = list(roots) if roots is not None else onedrive_bases()
    found = []
    seen = set()

    def add(path: Path) -> None:
        try:
            key = str(path.resolve()).lower()
        except OSError:
            key = str(path).lower()
        if key in seen or not path.is_dir() or path.name.startswith("."):
            return
        if not (path / "deck.json").is_file():
            return
        seen.add(key)
        found.append(folder_record(path.name, "path", str(path)))

    def own_drafts(path: Path, depth: int) -> None:
        if depth > 6:
            return
        try:
            children = list(path.iterdir())
        except OSError:
            return
        for child in children:
            if not child.is_dir() or child.name.startswith("."):
                continue
            lowered = child.name.lower()
            if lowered == "editor-drafts":
                try:
                    sessions = list(child.iterdir())
                except OSError:
                    continue
                for session in sessions:
                    add(session)
                continue
            if depth < 5 and lowered in DRAFT_WALK:
                own_drafts(child, depth + 1)

    for base in bases:
        try:
            children = list(base.iterdir())
        except OSError:
            continue
        for child in children:
            add(child)
        if not shared_mode():
            own_drafts(base, 0)
    found.sort(key=lambda item: item["name"].lower())
    return found


def referenced_images(deck: dict) -> list[str]:
    text = json.dumps(deck)
    found = []
    seen = set()
    for match in re.findall(r"[\w./-]+\.(?:png|jpe?g|webp|gif|svg)", text, re.I):
        rel = match.replace("\\", "/").lstrip("/")
        if rel in seen or rel.startswith("upload:"):
            continue
        seen.add(rel)
        found.append(rel)
    return found


def pack_session_images(folder: Path, deck: dict) -> None:
    """Copy pictures the slides point at into the session folder, so a share includes them."""
    if shared_mode() or not isinstance(deck, dict):
        return
    theme_pictures = {
        "asthma": ["asthma/assets/title-ambulance-asthma.png"],
        "copd": ["copd/assets/title-ambulance.png"],
        "hf": ["hf/assets/title-ambulance-hf.png"],
    }
    pictures = referenced_images(deck) + theme_pictures.get(str(deck.get("course") or ""), [])
    for rel in pictures:
        rel_path = Path(rel)
        if rel_path.is_absolute() or ".." in rel_path.parts:
            continue
        source = (ROOT / rel_path).resolve()
        if ROOT not in source.parents or not source.is_file():
            continue
        if source.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        dest = folder / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            if dest.is_file() and source.stat().st_mtime <= dest.stat().st_mtime + 1:
                continue
            shutil.copy2(source, dest)
        except OSError:
            continue


def image_in_sessions(url_path: str, folders: list[Path]) -> Path | None:
    rel = urllib.parse.unquote(url_path.split("?", 1)[0]).lstrip("/")
    wanted = Path(rel)
    if wanted.is_absolute() or ".." in wanted.parts or wanted.suffix.lower() not in IMAGE_SUFFIXES:
        return None
    for folder in folders:
        try:
            root = os.path.normcase(os.path.abspath(folder)).rstrip("\\/")
            candidate = folder / wanted
            cand = os.path.normcase(os.path.abspath(candidate))
        except OSError:
            continue
        if not cand.startswith(root + os.sep):
            continue
        if candidate.is_file():
            return candidate
    return None


_shared_folder_cache: tuple[float, list[dict]] | None = None


def shared_folders_cached() -> list[dict]:
    """Picture requests reuse the folder list for a few seconds."""
    global _shared_folder_cache
    now = time.time()
    if _shared_folder_cache and now - _shared_folder_cache[0] < 8:
        return _shared_folder_cache[1]
    found = list_shared_folders()
    _shared_folder_cache = (now, found)
    return found


def session_image(url_path: str) -> Path | None:
    folders = [Path(str(item.get("itemId") or "")) for item in shared_folders_cached()]
    return image_in_sessions(url_path, [folder for folder in folders if folder])


def ensure_project_editor() -> None:
    if shared_mode():
        raise ValueError("This editor only saves into the session folder that was shared with you.")


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
    index = ROOT / "index.html"
    bundled = EDITOR / "preview.css"
    if index.is_file():
        text = index.read_text(encoding="utf-8")
        start = text.find("<style>")
        end = text.find("</style>", start)
        css = text[start + len("<style>"):end] if start >= 0 and end >= 0 else ""
    elif bundled.is_file():
        css = bundled.read_text(encoding="utf-8")
    else:
        css = ""
    PREVIEW_CSS = css + """
      html, body { height: 100%; overflow: hidden; }
      .stage { height: 100% !important; padding: 0 !important; }
    """
    return PREVIEW_CSS


def static_file(url_path: str) -> Path | None:
    if shared_mode():
        return None
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
    path = Path(item_id)
    if not path.is_dir():
        raise ValueError("That folder is not on this computer")
    if not inside_onedrive(path):
        raise ValueError("Choose a folder inside OneDrive")
    try:
        resolved = path.resolve()
    except OSError:
        resolved = path
    if resolved in onedrive_bases() or path in onedrive_bases():
        raise ValueError("Open a session folder, such as COPD")
    return resolved if inside_onedrive(resolved) else path


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


def folder_is_direct_share(folder: Path, bases: list[Path] | None = None) -> bool:
    """True when the session folder itself sits in OneDrive, which is how a share is added."""
    roots = []
    for base in bases if bases is not None else onedrive_bases():
        roots.append(str(base).lower().rstrip("\\/"))
        try:
            roots.append(str(base.resolve()).lower().rstrip("\\/"))
        except OSError:
            continue
    parents = [str(folder.parent).lower().rstrip("\\/")]
    try:
        parents.append(str(folder.resolve().parent).lower().rstrip("\\/"))
    except OSError:
        pass
    return any(parent in roots for parent in parents)


def require_shared_grant(folder: Path) -> None:
    if not shared_mode():
        return
    if folder_is_direct_share(folder):
        return
    raise GraphError(403, "You have not been given access to this session.")


def read_disk_deck(drive_id: str, item_id: str) -> dict | None:
    folder = disk_path(drive_id, item_id)
    require_shared_grant(folder)
    path = folder / "deck.json"
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return validate_deck(data)


def write_disk_deck(drive_id: str, item_id: str, deck: dict, email: str) -> dict:
    deck = validate_deck(deck)
    folder = disk_path(drive_id, item_id)
    require_shared_grant(folder)
    folder.mkdir(parents=True, exist_ok=True)
    deck["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    deck["updatedBy"] = email or "this computer"
    (folder / "deck.json").write_text(json.dumps(deck, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pack_session_images(folder, deck)
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
    guessed = mimetypes.guess_type(path.name)[0]
    return guessed or "application/octet-stream"


def process_sid(pid: int) -> str | None:
    """Account id for a process. Empty string means Windows refused the lookup."""
    if os.name != "nt":
        return None
    import ctypes
    from ctypes import wintypes
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    advapi = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL
    kernel.LocalFree.argtypes = [wintypes.HLOCAL]
    kernel.LocalFree.restype = wintypes.HLOCAL
    advapi.OpenProcessToken.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE)]
    advapi.OpenProcessToken.restype = wintypes.BOOL
    advapi.GetTokenInformation.argtypes = [wintypes.HANDLE, ctypes.c_int, wintypes.LPVOID, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    advapi.GetTokenInformation.restype = wintypes.BOOL
    advapi.ConvertSidToStringSidW.argtypes = [wintypes.LPVOID, ctypes.POINTER(wintypes.LPWSTR)]
    advapi.ConvertSidToStringSidW.restype = wintypes.BOOL
    process = kernel.OpenProcess(0x1000, False, pid)
    if not process:
        return "" if ctypes.get_last_error() == 5 else None
    token = wintypes.HANDLE()
    try:
        if not advapi.OpenProcessToken(process, 0x0008, ctypes.byref(token)):
            return "" if ctypes.get_last_error() == 5 else None
        needed = wintypes.DWORD(0)
        advapi.GetTokenInformation(token, 1, None, 0, ctypes.byref(needed))
        if needed.value <= 0:
            return None
        buf = ctypes.create_string_buffer(needed.value)
        if not advapi.GetTokenInformation(token, 1, buf, needed.value, ctypes.byref(needed)):
            return None
        sid_ptr = ctypes.cast(buf, ctypes.POINTER(ctypes.c_void_p))[0]
        text = wintypes.LPWSTR()
        if not advapi.ConvertSidToStringSidW(sid_ptr, ctypes.byref(text)) or not text.value:
            return None
        try:
            return str(text.value)
        finally:
            kernel.LocalFree(text)
    finally:
        if token:
            kernel.CloseHandle(token)
        kernel.CloseHandle(process)


def loopback_client_pid(server_port: int, client_port: int) -> int | None:
    """Process at the other end of a connection to this editor. None if it cannot be seen."""
    if os.name != "nt":
        return None
    import ctypes
    import socket
    from ctypes import wintypes
    iphlpapi = ctypes.WinDLL("iphlpapi", use_last_error=True)
    iphlpapi.GetExtendedTcpTable.argtypes = [wintypes.LPVOID, ctypes.POINTER(wintypes.DWORD), wintypes.BOOL, wintypes.ULONG, ctypes.c_int, wintypes.ULONG]
    iphlpapi.GetExtendedTcpTable.restype = wintypes.DWORD

    class TcpRow(ctypes.Structure):
        _fields_ = [
            ("state", wintypes.DWORD),
            ("local_addr", wintypes.DWORD),
            ("local_port", wintypes.DWORD),
            ("remote_addr", wintypes.DWORD),
            ("remote_port", wintypes.DWORD),
            ("pid", wintypes.DWORD),
        ]

    size = wintypes.DWORD(0)
    iphlpapi.GetExtendedTcpTable(None, ctypes.byref(size), False, 2, 5, 0)
    if size.value <= 0:
        return None
    buf = ctypes.create_string_buffer(size.value)
    if iphlpapi.GetExtendedTcpTable(buf, ctypes.byref(size), False, 2, 5, 0) != 0:
        return None
    count = ctypes.cast(buf, ctypes.POINTER(wintypes.DWORD))[0]
    row_size = ctypes.sizeof(TcpRow)
    base = ctypes.addressof(buf) + ctypes.sizeof(wintypes.DWORD)
    me = os.getpid()
    seen = None
    loopback = 0x0100007F
    for index in range(count):
        row = TcpRow.from_address(base + index * row_size)
        if row.local_addr != loopback and row.remote_addr != loopback:
            continue
        local = socket.ntohs(row.local_port & 0xFFFF)
        remote = socket.ntohs(row.remote_port & 0xFFFF)
        if {local, remote} != {server_port, client_port}:
            continue
        if row.pid != me:
            return int(row.pid)
        seen = int(row.pid)
    return seen


def foreign_windows_caller(handler: BaseHTTPRequestHandler) -> bool:
    """True when another Windows sign-in on this PC is calling the owner's editor."""
    if os.name != "nt":
        return False
    try:
        client_port = int(handler.client_address[1])
        server_port = int(handler.server.server_address[1])
    except (TypeError, ValueError, AttributeError):
        return False
    pid = loopback_client_pid(server_port, client_port)
    if pid is None or pid == os.getpid():
        return False
    sid = process_sid(pid)
    if sid == "":
        return True
    if not sid:
        return False
    mine = process_sid(os.getpid())
    return bool(mine) and sid != mine


class Handler(BaseHTTPRequestHandler):
    timeout = 90

    def log_message(self, fmt: str, *args) -> None:
        # A windowed install has no console, and writing the log then drops the page.
        if sys.stderr is None:
            return
        path = urllib.parse.urlparse(self.path).path
        if path.startswith("/api/") or path.startswith("/auth/"):
            return
        try:
            super().log_message(fmt, *args)
        except Exception:
            return

    def require_this_account(self) -> None:
        if foreign_windows_caller(self):
            raise GraphError(403, "You have not been given access to this session.")

    def do_GET(self) -> None:
        try:
            self.route_get()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, TimeoutError):
            return
        except GraphError as err:
            code = err.status if err.status in {401, 403} else 400
            self.send_json({"error": str(err)}, code)
        except ValueError as err:
            self.send_json({"error": str(err)}, 400)
        except Exception:
            note_failure("reading")
            self.send_json({"error": "The editor hit a problem reading that request"}, 500)

    def do_POST(self) -> None:
        try:
            self.route_post()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, TimeoutError):
            return
        except GraphError as err:
            code = err.status if err.status in {401, 403} else 400
            self.send_json({"error": str(err)}, code)
        except ValueError as err:
            self.send_json({"error": str(err)}, 400)
        except Exception:
            note_failure("saving")
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
            self.require_this_account()
            drive_id = query.get("driveId", [""])[0]
            item_id = query.get("itemId", [""])[0]
            validate_ids(drive_id, item_id)
            deck = read_disk_deck(drive_id, item_id) if drive_id in {"local", "path"} else read_onedrive_deck(drive_id, item_id)
            self.send_json({"deck": deck})
            return
        if path == "/media":
            self.require_this_account()
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
            self.require_this_account()
            self.send_file(found)
            return
        if shared_mode():
            image = session_image(path)
            if image is not None:
                self.send_file(image)
                return
        self.send_error(404, "Not found")

    def route_post(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path not in {"/api/config", "/api/logout"}:
            self.require_this_account()
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
            ensure_project_editor()
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
            ensure_project_editor()
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
            ensure_project_editor()
            data = self.read_json()
            self.require_project_write(str(data.get("driveId") or ""))
            restore_project_deck(str(data.get("course") or ""))
            self.send_json({"ok": True, "live": False})
            return
        self.send_error(404, "Not found")

    def status_payload(self) -> dict:
        cfg = load_config()
        me = current_user() if cfg["client_id"] and load_token() else None
        foreign = foreign_windows_caller(self)
        shared = shared_mode() or foreign
        drives = onedrive_bases() if shared and not foreign else []
        return {
            "configured": bool(cfg["client_id"] and cfg["owner_email"]),
            "onedrive": "" if foreign else (str(drives[0]) if shared and drives else ("" if shared else str(pc_drafts_root()))),
            "redirectUri": REDIRECT_URI,
            "signedIn": False if foreign else bool(me),
            "user": None if foreign else public_user(me),
            "owner": False if shared else is_owner(me),
            "project": False if shared else project_ready(),
            "imports": [] if shared else imports_available(),
            "topics": [] if foreign else topic_catalog(),
            "published": {} if shared else {key: draft_is_live(key) for key in COURSE_FILES},
            "shared": shared,
            "foreign": foreign,
            "account": process_sid(os.getpid()) or "",
            "build": EDITOR_BUILD,
        }

    def folders_for(self, source: str) -> list[dict]:
        if foreign_windows_caller(self):
            return []
        if shared_mode():
            return list_shared_folders()
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
    assert guess_course("Stroke / TIA") == "stroke"
    assert any(item["id"] == "stroke" and not item["published"] for item in topics)
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
    scratch = Path(tempfile.mkdtemp())
    try:
        session = scratch / "Stroke"
        session.mkdir()
        (session / "deck.json").write_text("{}", encoding="utf-8")
        (scratch / "notes").mkdir()
        nested = scratch / "shared" / "COPD"
        nested.mkdir(parents=True)
        (nested / "deck.json").write_text("{}", encoding="utf-8")
        owned = scratch / "Cursor Projects" / "CPD" / "Hub-CPD" / "editor-drafts" / "Heart failure"
        owned.mkdir(parents=True)
        (owned / "deck.json").write_text("{}", encoding="utf-8")
        hidden = scratch / "Pictures" / "secret"
        hidden.mkdir(parents=True)
        (hidden / "deck.json").write_text("{}", encoding="utf-8")
        found = list_shared_folders([scratch])
        names = {item["name"] for item in found}
        assert names == {"Stroke", "Heart failure"}
        assert all(item["driveId"] == "path" for item in found)
        assert folder_is_direct_share(session, [scratch])
        assert not folder_is_direct_share(owned, [scratch])
        mine = process_sid(os.getpid())
        assert mine and mine.startswith("S-1-")
        import socket
        listener = socket.socket()
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        port = listener.getsockname()[1]
        client = socket.socket()
        client.connect(("127.0.0.1", port))
        conn, addr = listener.accept()
        found_pid = loopback_client_pid(port, addr[1])
        conn.close()
        client.close()
        listener.close()
        assert found_pid == os.getpid(), found_pid
        logo = ROOT / "assets" / "hub-cpd-logo.png"
        if logo.is_file():
            packed = scratch / "packtest"
            packed.mkdir()
            pack_session_images(packed, {"slides": [{"html": '<img src="assets/hub-cpd-logo.png">'}]})
            assert (packed / "assets" / "hub-cpd-logo.png").is_file()
            assert image_in_sessions("/assets/hub-cpd-logo.png", [packed]) is not None
    finally:
        shutil.rmtree(scratch, ignore_errors=True)
    print("editor check ok")


def note_failure(kind: str) -> None:
    try:
        import traceback
        log_dir = Path(os.environ.get("LOCALAPPDATA") or tempfile.gettempdir())
        log_dir.mkdir(parents=True, exist_ok=True)
        with (log_dir / "hub-cpd-editor.log").open("a", encoding="utf-8") as log:
            log.write(kind + "\n")
            traceback.print_exc(file=log)
    except Exception:
        return


def editor_page_ok(port: int) -> bool:
    """True only when this build is already running for this Windows account."""
    url = "http://%s:%s/api/status" % (HOST, port)
    try:
        with urllib.request.urlopen(url, timeout=2) as res:
            if res.status != 200:
                return False
            data = json.loads(res.read().decode("utf-8"))
            return data.get("build") == EDITOR_BUILD and data.get("account") == (process_sid(os.getpid()) or "")
    except Exception:
        return False


def port_open(port: int) -> bool:
    import socket
    sock = socket.socket()
    sock.settimeout(0.4)
    try:
        sock.connect((HOST, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def listen_editor(preferred: int) -> tuple[ThreadingHTTPServer, int] | None:
    """Bind a free port. Leave another account's editor on its own port."""
    ports = [preferred] if preferred != PORT else list(range(PORT, PORT + 20))
    for port in ports:
        if port_open(port):
            if editor_page_ok(port):
                webbrowser.open("http://%s:%s/" % (HOST, port))
                return None
            continue
        try:
            return ThreadingHTTPServer((HOST, port), Handler), port
        except OSError:
            continue
    raise OSError("The Hub CPD editor could not start")


def chosen_port() -> int:
    if "--port" not in sys.argv:
        return PORT
    index = sys.argv.index("--port")
    if index + 1 >= len(sys.argv):
        raise SystemExit("Missing port number")
    return int(sys.argv[index + 1])


def claim_taskbar_app() -> None:
    """Tell Windows this window is Hub CPD, so the taskbar does not use the Python icon."""
    if os.name != "nt":
        return
    try:
        import ctypes
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("HubCPD.Editor")
    except Exception:
        return


def taskbar_icon_file() -> Path | None:
    source = EDITOR / "hub-cpd.ico"
    if not source.is_file():
        source = Path(__file__).resolve().parent / "editor_setup" / "hub-cpd.ico"
    if not source.is_file():
        return None
    dest = Path(tempfile.gettempdir()) / "hub-cpd-editor.ico"
    try:
        if not dest.is_file() or source.stat().st_mtime > dest.stat().st_mtime:
            shutil.copy2(source, dest)
        return dest
    except OSError:
        return source


def apply_window_icon(window) -> None:
    """Use the Hub CPD star on the window and on the taskbar."""
    ico = taskbar_icon_file()
    png = EDITOR / "hub-cpd-icon.png"
    if ico is not None:
        try:
            window.iconbitmap(default=str(ico))
        except Exception:
            pass
    if png.is_file():
        try:
            import tkinter as tk
            image = tk.PhotoImage(file=str(png))
            window.iconphoto(True, image)
            window._hub_icon = image
        except Exception:
            pass
    if os.name != "nt" or ico is None:
        return
    try:
        import ctypes
        from ctypes import wintypes
        window.update_idletasks()
        user32 = ctypes.windll.user32
        user32.LoadImageW.argtypes = [wintypes.HINSTANCE, wintypes.LPCWSTR, ctypes.c_uint, ctypes.c_int, ctypes.c_int, ctypes.c_uint]
        user32.LoadImageW.restype = wintypes.HANDLE
        user32.SendMessageW.argtypes = [wintypes.HWND, ctypes.c_uint, wintypes.WPARAM, wintypes.LPARAM]
        user32.GetParent.argtypes = [wintypes.HWND]
        user32.GetParent.restype = wintypes.HWND
        big = user32.LoadImageW(None, str(ico), 1, 32, 32, 0x10)
        small = user32.LoadImageW(None, str(ico), 1, 16, 16, 0x10)
        hwnd = user32.GetParent(window.winfo_id()) or window.winfo_id()
        if big:
            user32.SendMessageW(hwnd, 0x80, 1, big)
        if small:
            user32.SendMessageW(hwnd, 0x80, 0, small)
    except Exception:
        return


def show_about(parent) -> None:
    import tkinter as tk
    existing = getattr(parent, "_about", None)
    if existing is not None:
        try:
            if existing.winfo_exists():
                existing.lift()
                existing.focus_set()
                return
        except Exception:
            pass
    box = tk.Toplevel(parent)
    parent._about = box
    box.title("About Hub CPD Editor")
    box.resizable(False, False)
    box.transient(parent)
    apply_window_icon(box)
    tk.Label(box, text="Hub CPD Editor", font=("Segoe UI", 13, "bold")).pack(padx=28, pady=(16, 2))
    tk.Label(box, text="Version " + APP_VERSION, font=("Segoe UI", 10)).pack()
    tk.Label(box, text="Contact", font=("Segoe UI", 10)).pack(pady=(14, 0))
    mail = tk.Label(box, text=CONTACT_EMAIL, font=("Segoe UI", 10), fg="#1f5344", cursor="hand2")
    mail.pack()
    mail.bind("<Button-1>", lambda _event: webbrowser.open("mailto:" + CONTACT_EMAIL))
    tk.Button(box, text="OK", width=12, command=box.destroy).pack(pady=(16, 16))
    box.update_idletasks()
    box.geometry("+%d+%d" % (
        parent.winfo_rootx() + max(0, (parent.winfo_width() - box.winfo_width()) // 2),
        parent.winfo_rooty() + max(0, (parent.winfo_height() - box.winfo_height()) // 2),
    ))
    box.grab_set()
    box.focus_set()
    box.bind("<Escape>", lambda _event: box.destroy())
    box.bind("<Return>", lambda _event: box.destroy())


def run_installed(port: int) -> None:
    import tkinter as tk
    claim_taskbar_app()
    try:
        listened = listen_editor(port)
    except OSError:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, "The Hub CPD editor could not start. Close any Hub CPD editor window and try again.", "Hub CPD editor", 0)
        return
    if listened is None:
        return
    server, port = listened
    url = "http://%s:%s/" % (HOST, port)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    window = tk.Tk()
    window.title("Hub CPD editor")
    apply_window_icon(window)
    window.geometry("500x230")
    window.resizable(False, False)
    message = tk.Label(
        window,
        justify="left",
        wraplength=420,
        text=(
            "This window keeps the editor running. Your browser should have opened it.\n\n"
            "If a session is missing, open the share email and choose Add shortcut to My files. "
            "Wait for OneDrive to finish, then click Open the editor again.\n\n"
            "Close this window when you have finished."
        ),
    )
    message.pack(padx=18, pady=16, anchor="w")
    row = tk.Frame(window)
    row.pack(pady=(0, 16))

    def close() -> None:
        server.shutdown()
        window.destroy()

    tk.Button(row, text="Open the editor again", command=lambda: webbrowser.open(url)).pack(side="left", padx=6)
    tk.Button(row, text="About", command=lambda: show_about(window)).pack(side="left", padx=6)
    tk.Button(row, text="Close the editor", command=close).pack(side="left", padx=6)
    window.protocol("WM_DELETE_WINDOW", close)
    window.after(200, lambda: apply_window_icon(window))
    webbrowser.open(url)
    window.mainloop()
    server.server_close()


def main() -> None:
    if "--check" in sys.argv:
        check()
        return
    port = chosen_port()
    if getattr(sys, "frozen", False):
        run_installed(port)
        return
    listened = listen_editor(port)
    if listened is None:
        return
    server, port = listened
    url = "http://%s:%s/" % (HOST, port)
    print("Hub CPD editor")
    print("  Open:        " + url)
    if shared_mode():
        print("  Shared sessions only. This does not update hub-cpd.co.uk.")
    else:
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
