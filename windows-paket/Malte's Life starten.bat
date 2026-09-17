@echo off
rem ============================================================
rem  MALTE'S LIFE starten
rem  Oeffnet die App in einem eigenen Fenster, ohne Browser-Leiste.
rem  Diese Datei muss im selben Ordner liegen wie MaltesLife.html
rem ============================================================
setlocal enableextensions

set "SEITE=%~dp0MaltesLife.html"
if not exist "%SEITE%" (
  echo.
  echo   MaltesLife.html wurde nicht gefunden.
  echo   Diese Startdatei muss im selben Ordner liegen wie die App.
  echo.
  pause
  exit /b 1
)

rem Enthaelt der Pfad Sonderzeichen wie Akzente, Apostrophe oder
rem Umlaute, kann der Browser die Adresse nicht lesen und oeffnet
rem seine Startseite. Windows fuehrt zu jedem Ordner zusaetzlich
rem einen Kurznamen ohne solche Zeichen - den nehmen wir.
set "KURZ="
for %%I in ("%~dp0MaltesLife.html") do set "KURZ=%%~sfI"
if defined KURZ if exist "%KURZ%" set "SEITE=%KURZ%"

rem Windows-Pfad in eine Adresse umwandeln: Backslash zu Schraegstrich
set "ADRESSE=file:///%SEITE:\=/%"

rem Edge ist auf jedem Windows vorhanden, Chrome als Alternative
set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%BROWSER%" (
  start "" "%BROWSER%" --app="%ADRESSE%" --window-size=520,860
) else (
  rem Kein Edge, kein Chrome: dann eben im Standardbrowser
  start "" "%SEITE%"
)
exit /b 0
