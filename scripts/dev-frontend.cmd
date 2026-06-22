@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "FRONTEND_DIR=%ROOT_DIR%\frontend"

cd /d "%FRONTEND_DIR%"
npm.cmd run dev -- --host 127.0.0.1

endlocal
