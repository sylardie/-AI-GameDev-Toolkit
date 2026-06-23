@echo off
setlocal

set "ROOT_DIR=%~dp0.."
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "ELECTRON_RUN_AS_NODE="

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

if not exist "%FRONTEND_DIR%\node_modules\.bin\electron.cmd" (
  echo Electron dependencies not found.
  echo Installing frontend dependencies with npm.cmd install...
  echo.
  pushd "%FRONTEND_DIR%"
  call npm.cmd install
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)

echo Starting AI GameDev Toolkit Electron dev shell...
echo.
echo Desktop window: Electron
echo Frontend:       http://127.0.0.1:5173
echo Backend:        http://127.0.0.1:8010
echo.

pushd "%FRONTEND_DIR%"
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
  echo Existing Vite server detected on port 5173.
  echo Reusing it and opening Electron only.
  echo.
  call npm.cmd run electron:dev:ui
) else (
  call npm.cmd run electron:dev
)
if errorlevel 1 (
  echo.
  echo Electron dev shell exited with an error.
  pause
)
popd

endlocal
