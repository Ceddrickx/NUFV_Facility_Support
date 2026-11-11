@echo off
REM Double-click to run the responsive + content-freeze checks. Add --full or --all after the name in a terminal for bigger runs.
cd /d "%~dp0tests\responsive"
node run.mjs %*
echo.
pause
