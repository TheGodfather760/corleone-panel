; Corleone Panel - Inno Setup Installer Script
; Versiyon: 0.7.0.1

#define AppName "Corleone Panel"
#define AppVersion "0.7.0.1"
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
DefaultDirName={localappdata}\Programs\{#AppName}
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
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}

; Görseller
WizardImageFile=src-tauri\nsis\sidebar.bmp
WizardSmallImageFile=src-tauri\nsis\logo-setup-corleone.bmp
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

[Files]
Source: "{#SourceDir}\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "src-tauri\nsis\sidebar.bmp"; DestDir: "{tmp}"; Flags: dontcopy
Source: "src-tauri\nsis\setup-logotype-corleone.bmp"; DestDir: "{tmp}"; Flags: dontcopy

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Corleone Panel'i başlat"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
procedure InitializeWizard();
begin
  // BMP dosyalarını tmp'ye çıkar
  ExtractTemporaryFile('sidebar.bmp');
  ExtractTemporaryFile('setup-logotype-corleone.bmp');

  // Tüm arka planlar beyaz
  WizardForm.Color := clWhite;
  WizardForm.Font.Color := clBlack;
  WizardForm.Font.Size := 9;

  // Başlık
  WizardForm.PageNameLabel.Font.Color := $1A6BC4;
  WizardForm.PageNameLabel.Font.Style := [fsBold];
  WizardForm.PageNameLabel.Font.Size := 11;
  WizardForm.PageDescriptionLabel.Font.Color := $555555;

  // İçerik paneli
  WizardForm.InnerPage.Color := clWhite;

  // Input alanları
  WizardForm.DirEdit.Color := clWhite;
  WizardForm.DirEdit.Font.Color := clBlack;
  WizardForm.ReadyMemo.Color := clWhite;
  WizardForm.ReadyMemo.Font.Color := clBlack;
  WizardForm.LicenseMemo.Color := clWhite;
  WizardForm.LicenseMemo.Font.Color := clBlack;

  // Welcome yazıları
  WizardForm.WelcomeLabel1.Font.Color := clBlack;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel2.Font.Color := $333333;
  WizardForm.FinishedLabel.Font.Color := clBlack;
  WizardForm.FinishedHeadingLabel.Font.Color := clBlack;
  WizardForm.FinishedHeadingLabel.Font.Style := [fsBold];
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  WizardForm.InnerPage.Color := clWhite;
  WizardForm.WelcomeLabel1.Font.Color := clBlack;
  WizardForm.WelcomeLabel2.Font.Color := $333333;

  if CurPageID = wpWelcome then
    WizardForm.WizardBitmapImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\sidebar.bmp'))
  else
    WizardForm.WizardBitmapImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\setup-logotype-corleone.bmp'));
end;



