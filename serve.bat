@echo off
rem ---------------------------------------------------------------------------
rem Serve the study library over http so the browser will keep your progress.
rem
rem Every page works from file://, but browsers give file:// pages a throwaway
rem storage area, so ticked checkboxes vanish on reload. The storage banner on
rem each page points here. Double-click this file, then use the address below.
rem ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"
set PORT=8000

set PY=
where py >nul 2>&1 && set PY=py -3
if not defined PY where python >nul 2>&1 && set PY=python

if not defined PY (
  echo Python was not found on this machine.
  echo.
  echo Install it from https://www.python.org/downloads/ ^(tick "Add to PATH"^),
  echo or serve this folder with any other static file server, for example:
  echo     npx serve .
  echo.
  pause
  exit /b 1
)

echo Serving this folder at http://localhost:%PORT%/
echo Bookmark that address. Press Ctrl+C in this window to stop.
echo.
start "" "http://localhost:%PORT%/index.html"
%PY% -m http.server %PORT%
