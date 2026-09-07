; Corleone Panel - Inno Setup Installer Script
; Versiyon: 0.5.0

#define AppName "Corleone Panel"
#define AppVersion "0.5.0"
#define AppPublisher "Corleone Team"
#define AppURL "https://corleoneteam.com.tr"
#define AppExeName "corleone-panel.exe"
#define SourceDir "src-tauri\target\release"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=installer-output
OutputBaseFilename=Corleone-Panel-Setup-{#AppVersion}
SetupIconFile=src-tauri\icons\Corleone-Setup.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=classic
WizardSizePercent=100
DisableWelcomePage=no
DisableDirPage=no
DisableProgramGroupPage=yes
DisableReadyPage=no
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}

; Görseller
WizardImageFile=src-tauri\nsis\sidebar.bmp
WizardSmallImageFile=src-tauri\nsis\logotype-corleone-setup.bmp
WizardImageBackColor=$1A1A1A
WizardImageStretch=yes
LicenseFile=src-tauri\nsis\license.txt

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[CustomMessages]
turkish.WelcomeLabel1=Corleone Panel Kurulum Sihirbazına Hoş Geldiniz
turkish.WelcomeLabel2=Bu sihirbaz {#AppName} v{#AppVersion} sürümünü bilgisayarınıza kuracaktır.%n%nDevam etmeden önce tüm uygulamaları kapatmanız önerilir.
turkish.FinishedLabel=Corleone Panel başarıyla kuruldu!%n%nUygulamayı başlatmak için Kapat'a tıklayın.

[Tasks]
Name: "desktopicon"; Description: "Masaüstü kısayolu oluştur"; GroupDescription: "Ek görevler:"; Flags: unchecked
Name: "startupicon"; Description: "Windows başlangıcında otomatik başlat"; GroupDescription: "Ek görevler:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startupicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Corleone Panel'i başlat"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
const
  BG     = $100C08;
  TEXT_C = $C8B99A;
  ACCENT = $23A6F5;
  MUTED  = $6B5C45;
  INPUT  = $2A2218;

procedure SetLabelColors();
begin
  // Welcome sayfası
  WizardForm.WelcomeLabel1.Font.Color := ACCENT;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel2.Font.Color := TEXT_C;
  // Finish sayfası
  WizardForm.FinishedLabel.Font.Color := TEXT_C;
  WizardForm.FinishedHeadingLabel.Font.Color := ACCENT;
  // Dir sayfası
  WizardForm.SelectDirLabel.Font.Color := TEXT_C;
  WizardForm.SelectDirBrowseLabel.Font.Color := MUTED;
  // Ready sayfası
  WizardForm.ReadyLabel.Font.Color := TEXT_C;
  // Genel
  WizardForm.PageNameLabel.Font.Color := ACCENT;
  WizardForm.PageNameLabel.Font.Style := [fsBold];
  WizardForm.PageNameLabel.Font.Size := 11;
  WizardForm.PageDescriptionLabel.Font.Color := MUTED;
  WizardForm.StatusLabel.Font.Color := TEXT_C;
  WizardForm.FilenameLabel.Font.Color := MUTED;
end;

procedure InitializeWizard();
begin
  WizardForm.Color := BG;
  WizardForm.Font.Color := TEXT_C;
  WizardForm.Font.Size := 9;
  WizardForm.InnerPage.Color := BG;
  WizardForm.DirEdit.Color := INPUT;
  WizardForm.DirEdit.Font.Color := TEXT_C;
  WizardForm.ReadyMemo.Color := INPUT;
  WizardForm.ReadyMemo.Font.Color := TEXT_C;
  WizardForm.LicenseMemo.Color := INPUT;
  WizardForm.LicenseMemo.Font.Color := TEXT_C;
  SetLabelColors();
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  WizardForm.InnerPage.Color := BG;
  SetLabelColors();
end;
