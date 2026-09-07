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
WizardStyle=modern
WizardSizePercent=120
DisableWelcomePage=no
DisableDirPage=no
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}

; Koyu tema renkleri
WizardImageFile=src-tauri\nsis\sidebar.bmp
WizardSmallImageFile=src-tauri\nsis\header.bmp

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
// Koyu tema için renk özelleştirmeleri
procedure InitializeWizard();
begin
  // Wizard arka plan rengi
  WizardForm.Color := $1A1A1A;
  WizardForm.Font.Color := $DDDDDD;
  
  // Buton renkleri
  WizardForm.NextButton.Font.Color := $000000;
  WizardForm.BackButton.Font.Color := $000000;
  WizardForm.CancelButton.Font.Color := $000000;
  
  // Başlık alanı
  WizardForm.PageDescriptionLabel.Font.Color := $888888;
  WizardForm.PageNameLabel.Font.Color := $F5A623;
  WizardForm.PageNameLabel.Font.Style := [fsBold];
end;
