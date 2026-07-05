; 灵栈 LingStack NSIS 中文 Hook

; Post-install: create desktop shortcut
Function NSIS_HOOK_POSTINSTALL
  CreateShortCut "$DESKTOP\灵栈 LingStack.lnk" "$INSTDIR\lingstack.exe"
FunctionEnd

; Post-uninstall message
Function un.NSIS_HOOK_POSTUNINSTALL
  MessageBox MB_ICONINFORMATION|MB_OK "灵栈 LingStack 已成功卸载。感谢您的使用！"
FunctionEnd