; Corleone Panel - NSIS Installer Özelleştirme
; Bu dosya Tauri'nin NSIS installer'ına eklenir

!macro NSIS_HOOK_PREINSTALL
  ; Koyu arka plan
  SetCtlColors $HWNDPARENT 0xDDDDDD 0x1A1A1A
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend
