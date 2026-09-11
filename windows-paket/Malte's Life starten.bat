@echo off
rem ============================================================
rem  MALTE'S LIFE starten
rem  Oeffnet die App in einem eigenen Fenster, ohne Browser-Leiste.
rem  Diese Datei muss im selben Ordner liegen wie MaltesLife.html
rem ============================================================
setlocal
set "SEITE=%~dp0MaltesLife.html"

if not exist "%SEITE%" (
  echo.
  echo   MaltesLife.html wurde nicht gefunden.
  echo   Diese Startdatei muss im selben Ordner liegen wie die App.
  echo.
  pause
  exit /b 1
)

rem Windows-Pfad in eine Adresse umwandeln: Backslash zu Schraegstrich
set "ADRESSE=file:///%SEITE:\=/%"

rem Edge ist auf jedem Windows vorhanden, Chrome als Alternative
set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%BROWSER%" (
  start "" "%BROWSER%" --app="%ADRESSE%" --window-size=520,940
) else (
  rem Kein Edge, kein Chrome: dann eben im Standardbrowser
  start "" "%SEITE%"
)
exit /b 0
