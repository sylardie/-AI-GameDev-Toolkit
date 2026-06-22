@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"

if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  echo Backend virtual environment not found:
  echo %BACKEND_DIR%\.venv\Scripts\python.exe
  echo.
  echo Create it first from backend\ with:
  echo python -m venv .venv
  echo .venv\Scripts\python.exe -m pip install -r requirements.txt
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules\.bin\vite.cmd" (
  echo Frontend dependencies not found:
  echo %FRONTEND_DIR%\node_modules
  echo.
  echo Installing frontend dependencies with npm.cmd install...
  pushd "%FRONTEND_DIR%"
  call npm.cmd install
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)

echo Starting AI GameDev Toolkit...
echo Backend:  http://127.0.0.1:8010
echo Frontend: http://127.0.0.1:5173
echo.

start "AI GameDev Toolkit Backend" cmd /k "%~dp0dev-backend.cmd"
start "AI GameDev Toolkit Frontend" cmd /k "%~dp0dev-frontend.cmd"

echo Started two terminal windows. Close them or run scripts\stop-dev.cmd to stop.
endlocal
