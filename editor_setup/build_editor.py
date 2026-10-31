"""Build the Windows editor other people install.

Run from the project folder:

    python editor_setup/build_editor.py

The installer is written to editor_setup/output/Hub-CPD-Editor-Setup.exe.
It contains the editor only. It does not contain this project.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SETUP = Path(__file__).resolve().parent
BUILD_ROOT = Path(os.environ.get("TEMP") or os.environ.get("TMP") or ".") / "HubCPDEditorBuild"
STAGE = BUILD_ROOT / "stage" / "editor"
DIST = BUILD_ROOT / "dist"
WORK = BUILD_ROOT / "build"
UI = (
    "index.html",
    "app.js",
    "deck.js",
    "layouts.js",
    "editor.css",
    "preview.html",
)


def app_version() -> str:
    text = (ROOT / "editor.py").read_text(encoding="utf-8")
    match = re.search(r'^APP_VERSION = "([^"]+)"', text, re.M)
    if not match:
        raise SystemExit("APP_VERSION is missing from editor.py")
    return match.group(1)


def topic_list() -> str:
    import ast
    import json
    text = (ROOT / "serve.py").read_text(encoding="utf-8")
    tree = ast.parse(text)
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(target, ast.Name) and target.id == "COURSES" for target in node.targets):
            continue
        raw = ast.literal_eval(node.value)
        topics = []
        for key, item in raw.items():
            topic_id = str(item.get("id") or key).strip()
            topics.append({
                "id": topic_id,
                "heading": str(item.get("home_heading") or item.get("title") or topic_id).strip(),
                "folder": str(item.get("folder") or topic_id).strip(),
                "published": bool(item.get("published", True)),
            })
        return json.dumps(topics, ensure_ascii=False, indent=2) + "\n"
    raise SystemExit("Could not read the topic list from serve.py")


def preview_css() -> str:
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    start = text.find("<style>")
    end = text.find("</style>", start)
    if start < 0 or end < 0:
        raise SystemExit("Could not read the slide styles from index.html")
    return text[start + len("<style>"):end]


def stage_files() -> None:
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)
    editor = ROOT / "editor"
    for name in UI:
        shutil.copy2(editor / name, STAGE / name)
    (STAGE / "preview.css").write_text(preview_css(), encoding="utf-8")
    (STAGE / "topics.json").write_text(topic_list(), encoding="utf-8")
    for name in ("hub-cpd.ico", "hub-cpd-icon.png"):
        shutil.copy2(SETUP / name, STAGE / name)


def build_exe() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    if WORK.exists():
        shutil.rmtree(WORK)
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--windowed",
        "--name",
        "HubCPDEditor",
        "--icon",
        str(SETUP / "hub-cpd.ico"),
        "--distpath",
        str(DIST),
        "--workpath",
        str(WORK),
        "--specpath",
        str(SETUP),
        "--add-data",
        str(STAGE) + ";editor",
        "--hidden-import",
        "tkinter",
        "--collect-submodules",
        "tkinter",
        str(ROOT / "editor.py"),
    ]
    subprocess.run(command, cwd=ROOT, check=True)
    exe = DIST / "HubCPDEditor" / "HubCPDEditor.exe"
    if not exe.is_file():
        raise SystemExit("The editor program was not created")


def find_iscc() -> Path | None:
    names = [
        Path(r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"),
        Path(r"C:\Program Files\Inno Setup 6\ISCC.exe"),
        Path.home() / "AppData" / "Local" / "Programs" / "Inno Setup 6" / "ISCC.exe",
    ]
    for path in names:
        if path.is_file():
            return path
    found = shutil.which("ISCC")
    return Path(found) if found else None


def build_installer() -> None:
    compiler = find_iscc()
    if compiler is None:
        print("Inno Setup is not installed, so the installer was not compiled.")
        print(DIST / "HubCPDEditor" / "HubCPDEditor.exe")
        return
    out_dir = BUILD_ROOT / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    source = str(DIST / "HubCPDEditor" / "*")
    script = BUILD_ROOT / "hub-editor.iss"
    script.write_text(
        (SETUP / "hub-editor.iss").read_text(encoding="utf-8")
        .replace('Source: "dist\\HubCPDEditor\\*"', 'Source: "' + source + '"')
        .replace("OutputDir=output", "OutputDir=" + str(out_dir))
        .replace("SetupIconFile=hub-cpd.ico", 'SetupIconFile="' + str(SETUP / "hub-cpd.ico") + '"')
        .replace('#define AppVersion "1.0.0"', '#define AppVersion "' + app_version() + '"'),
        encoding="utf-8",
    )
    subprocess.run([str(compiler), str(script)], cwd=BUILD_ROOT, check=True)
    setup = out_dir / "Hub-CPD-Editor-Setup.exe"
    if not setup.is_file():
        raise SystemExit("The installer was not created")
    dest_dir = SETUP / "output"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / setup.name
    shutil.copy2(setup, dest)
    print(dest)


def main() -> None:
    stage_files()
    build_exe()
    build_installer()


if __name__ == "__main__":
    main()
