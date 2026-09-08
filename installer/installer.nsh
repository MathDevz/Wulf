; ---------------------------------------------------------------------------
; Wulf — custom uninstaller
;
; Adds a page that asks the user, in plain language, whether to keep or destroy
; their data. Keeping is the default: an uninstall should never silently throw
; away someone's backlog.
; ---------------------------------------------------------------------------

!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinMessages.nsh"

; FileFunc macros must be explicitly imported for uninstaller use.
!insertmacro un.GetSize

!define WULF_BG   "FFFFFF"
!define WULF_FG   "000000"
!define WULF_DIM  "6E6E6E"

; Resolve where Wulf's data actually lives. Defaults to %APPDATA%\Wulf,
; but honours the pointer file written by the app when the user moved it.
!macro WulfResolveDataDir
  StrCpy $WulfDataDir "$APPDATA\Wulf"
  ${If} ${FileExists} "$APPDATA\Wulf\datadir.txt"
    ClearErrors
    FileOpen $0 "$APPDATA\Wulf\datadir.txt" r
    ${IfNot} ${Errors}
      FileRead $0 $1
      FileClose $0
      ; trim trailing CR/LF/space
      ${Do}
        StrCpy $2 $1 1 -1
        ${If} $2 == "$\r"
        ${OrIf} $2 == "$\n"
        ${OrIf} $2 == " "
          StrCpy $1 $1 -1
        ${Else}
          ${ExitDo}
        ${EndIf}
      ${Loop}
      ${If} $1 != ""
      ${AndIf} ${FileExists} "$1\*.*"
        StrCpy $WulfDataDir "$1"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnWelcomePage
  UninstPage custom un.WulfChoicePage un.WulfChoicePageLeave
!macroend

; These only exist in the uninstaller compilation pass; defining them during
; the installer pass produces "uninstaller code without WriteUninstaller".
!ifdef BUILD_UNINSTALLER

Var WulfKeepRadio
Var WulfWipeRadio
Var WulfWipeData      ; "1" = delete everything, "0" = keep data
Var WulfDataDir
Var WulfDataSize
Var WulfDataLine

Function un.WulfChoicePage
  ; MUI_HEADER_TEXT is not available this early in the parse order, so set the
  ; page header controls directly (1037 = title, 1038 = subtitle).
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Uninstall Wulf"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Choose what happens to the things you put in Wulf."

  !insertmacro WulfResolveDataDir

  ; Work out roughly how much data there is, so the choice is informed.
  StrCpy $WulfDataSize ""
  ${If} ${FileExists} "$WulfDataDir\*.*"
    ${un.GetSize} "$WulfDataDir" "/M=*.* /S=0K /G=1" $0 $1 $2
    ${IfNot} ${Errors}
      StrCpy $WulfDataSize "$0 KB"
    ${EndIf}
  ${EndIf}

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  SetCtlColors $0 "${WULF_FG}" "${WULF_BG}"

  ${NSD_CreateLabel} 0 0 100% 24u "Wulf is about to be removed from this computer. Your tasks, projects, notes, attachments and backups are stored separately from the program itself, so you can decide what to do with them."
  Pop $1
  SetCtlColors $1 "${WULF_FG}" "${WULF_BG}"

  ; ---- option 1: keep data ------------------------------------------------
  ${NSD_CreateRadioButton} 0 30u 100% 11u "Uninstall Wulf, keep my data"
  Pop $WulfKeepRadio
  SetCtlColors $WulfKeepRadio "${WULF_FG}" "${WULF_BG}"
  ${NSD_AddStyle} $WulfKeepRadio ${WS_GROUP}

  ${NSD_CreateLabel} 12u 42u 95% 18u "Recommended. Removes the application only. Everything you captured stays on disk, so reinstalling Wulf later picks up exactly where you left off."
  Pop $2
  SetCtlColors $2 "${WULF_DIM}" "${WULF_BG}"

  ; ---- option 2: remove everything ---------------------------------------
  ${NSD_CreateRadioButton} 0 66u 100% 11u "Uninstall Wulf and permanently delete all of my data"
  Pop $WulfWipeRadio
  SetCtlColors $WulfWipeRadio "${WULF_FG}" "${WULF_BG}"

  ${NSD_CreateLabel} 12u 78u 95% 18u "Deletes every task, project, note, attachment, snapshot and setting. This cannot be undone and no copy is kept anywhere."
  Pop $3
  SetCtlColors $3 "${WULF_DIM}" "${WULF_BG}"

  ; ---- where the data is --------------------------------------------------
  ${If} $WulfDataSize != ""
    StrCpy $WulfDataLine "Your data folder:  $WulfDataDir    ($WulfDataSize)"
  ${Else}
    StrCpy $WulfDataLine "Your data folder:  $WulfDataDir"
  ${EndIf}

  ${NSD_CreateLabel} 0 102u 100% 18u "$WulfDataLine"
  Pop $4
  SetCtlColors $4 "${WULF_DIM}" "${WULF_BG}"

  ; Keeping data is always the default selection.
  ${NSD_Check} $WulfKeepRadio
  StrCpy $WulfWipeData "0"

  nsDialogs::Show
FunctionEnd

Function un.WulfChoicePageLeave
  ${NSD_GetState} $WulfWipeRadio $0
  ${If} $0 == ${BST_CHECKED}
    ; Destructive and irreversible, so make the user say it twice.
    MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_DEFBUTTON2 \
      "Permanently delete everything in Wulf?$\r$\n$\r$\nThis erases all tasks, projects, notes, attachments and backups in:$\r$\n$WulfDataDir$\r$\n$\r$\nThis cannot be undone. If you are unsure, choose No and pick the option that keeps your data." \
      IDYES wulf_confirm_wipe
      Abort
    wulf_confirm_wipe:
    StrCpy $WulfWipeData "1"
  ${Else}
    StrCpy $WulfWipeData "0"
  ${EndIf}
FunctionEnd

!endif ; BUILD_UNINSTALLER

; Runs during the uninstall section, after the program files are removed.
!macro customUnInstall
  ${IfNot} ${Silent}
    ${If} $WulfWipeData == "1"
      ; Remove the data folder wherever the user moved it to...
      !insertmacro WulfResolveDataDir
      RMDir /r "$WulfDataDir"
      ; ...and the standard application data location, including settings,
      ; logs and any leftover Electron cache.
      RMDir /r "$APPDATA\Wulf"
      RMDir /r "$LOCALAPPDATA\Wulf"
      RMDir /r "$LOCALAPPDATA\wulf-updater"
    ${EndIf}
  ${EndIf}

  ; The app registers itself to start with Windows; always clean that up.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Wulf"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Wulf"
!macroend
