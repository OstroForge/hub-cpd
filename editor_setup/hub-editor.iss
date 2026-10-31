; Installer for the editor other people run.
; It does not include this project and it cannot update hub-cpd.co.uk.

#define AppName "Hub CPD Editor"
#define AppVersion "1.0.0"
#define AppExe "HubCPDEditor.exe"

[Setup]
AppId={{8F4C2A1E-6B37-4D5A-9C18-7E2B0D4F6A91}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Hub CPD
DefaultDirName={localappdata}\Hub CPD Editor
DefaultGroupName=Hub CPD Editor
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=output
OutputBaseFilename=Hub-CPD-Editor-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=hub-cpd.ico
UninstallDisplayIcon={app}\{#AppExe}
SetupLogging=yes

[Files]
Source: "dist\HubCPDEditor\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"

[Run]
Filename: "{app}\{#AppExe}"; Description: "Open the Hub CPD editor"; Flags: nowait postinstall skipifsilent
