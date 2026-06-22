@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "BACKEND_DIR=%ROOT_DIR%\backend"

cd /d "%BACKEND_DIR%"
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8010

endlocal
