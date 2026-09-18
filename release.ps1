# release.ps1 - Kullanim: .\release.ps1 "0.6.3" "Aciklama buraya"

param(
    [Parameter(Mandatory=$true)][string]$Version,
    [Parameter(Mandatory=$false)][string]$Message = "v$Version"
)

$tag = "v$Version"

# tauri.conf.json
$conf = Get-Content "src-tauri\tauri.conf.json" -Raw
$conf = $conf -replace '"version": "[^"]*"', "`"version`": `"$Version`""
Set-Content "src-tauri\tauri.conf.json" $conf

# installer.iss
$iss = Get-Content "installer.iss" -Raw
$iss = $iss -replace 'Versiyon: [^\r\n]*', "Versiyon: $Version"
$iss = $iss -replace '#define AppVersion "[^"]*"', "#define AppVersion `"$Version`""
Set-Content "installer.iss" $iss

# AppLayout.jsx
$layout = Get-Content "src\components\AppLayout.jsx" -Raw
$layout = $layout -replace 'setVersion\("[^"]*"\)', "setVersion(`"$Version`")"
$layout = $layout -replace 'ping\("[^"]*"\)', "ping(`"$Version`")"
Set-Content "src\components\AppLayout.jsx" $layout

Write-Host "Versiyon $Version olarak guncellendi." -ForegroundColor Green

# Git
git add .
git commit -m "$tag - $Message"
git tag $tag
git push origin main
git push origin $tag

Write-Host "Release $tag basariyla push edildi!" -ForegroundColor Cyan
Write-Host "GitHub Actions build basliyor: https://github.com/TheGodfather760/corleone-panel/actions" -ForegroundColor Yellow
