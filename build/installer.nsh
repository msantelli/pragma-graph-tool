; NSIS custom script for PATH registration
; Adds/removes the app install directory to/from user PATH
; so that pragma-cli.cmd is available from any terminal.

!include "WinMessages.nsh"

; --- Install: add install dir to user PATH ---
!macro customInstall
  ; Read current user PATH
  ReadRegStr $0 HKCU "Environment" "Path"

  ; If PATH is empty, just set it
  StrCmp $0 "" 0 _chk_path_exists
    WriteRegExpandStr HKCU "Environment" "Path" "$INSTDIR"
    Goto _path_install_broadcast

  _chk_path_exists:
  ; Search if $INSTDIR is already in PATH
  StrLen $2 $INSTDIR
  StrCpy $3 0

  _ci_search:
    StrCpy $1 $0 $2 $3
    StrCmp $1 "" _ci_not_found
    StrCmp $1 $INSTDIR _path_install_broadcast ; already present
    IntOp $3 $3 + 1
    Goto _ci_search

  _ci_not_found:
    ; Append to PATH
    WriteRegExpandStr HKCU "Environment" "Path" "$0;$INSTDIR"

  _path_install_broadcast:
  ; Broadcast WM_SETTINGCHANGE so open terminals pick up the change
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
!macroend

; --- Uninstall: remove install dir from user PATH ---
!macro customUnInstall
  ReadRegStr $0 HKCU "Environment" "Path"
  StrCmp $0 "" _path_uninstall_done

  ; Try to find and remove ";$INSTDIR" pattern (most common: appended entry)
  StrCpy $4 ";$INSTDIR"
  StrLen $2 $4
  StrLen $5 $0
  StrCpy $3 0

  _cu_search1:
    StrCpy $1 $0 $2 $3
    StrCmp $1 "" _cu_try2
    StrCmp $1 $4 _cu_remove1
    IntOp $3 $3 + 1
    Goto _cu_search1

  _cu_remove1:
    ; Build: chars before match + chars after match
    StrCpy $6 $0 $3           ; before
    IntOp $3 $3 + $2          ; skip past match
    StrCpy $7 $0 "" $3        ; after
    StrCpy $0 "$6$7"
    Goto _cu_write

  _cu_try2:
  ; Try to find and remove "$INSTDIR;" pattern (prepended entry)
  StrCpy $4 "$INSTDIR;"
  StrLen $2 $4
  StrCpy $3 0

  _cu_search2:
    StrCpy $1 $0 $2 $3
    StrCmp $1 "" _cu_try3
    StrCmp $1 $4 _cu_remove2
    IntOp $3 $3 + 1
    Goto _cu_search2

  _cu_remove2:
    StrCpy $6 $0 $3
    IntOp $3 $3 + $2
    StrCpy $7 $0 "" $3
    StrCpy $0 "$6$7"
    Goto _cu_write

  _cu_try3:
  ; Handle exact match (PATH == $INSTDIR)
  StrCmp $0 $INSTDIR 0 _cu_write
    StrCpy $0 ""

  _cu_write:
  StrCmp $0 "" 0 _cu_write_value
    DeleteRegValue HKCU "Environment" "Path"
    Goto _path_uninstall_done

  _cu_write_value:
    WriteRegExpandStr HKCU "Environment" "Path" "$0"

  _path_uninstall_done:
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
!macroend
