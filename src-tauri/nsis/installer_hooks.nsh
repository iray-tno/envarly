; Envarly NSIS installer hooks
; Called by the Tauri-generated installer at specific lifecycle points.

!macro NSIS_HOOK_PREUNINSTALL
  ; Remove Envarly from PATH before files are deleted.
  ; Return code is ignored — a failure leaves a harmless dead PATH entry.
  ExecWait '"$INSTDIR\envarly.exe" path-cleanup'
!macroend
