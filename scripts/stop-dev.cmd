@echo off
setlocal

echo Stopping AI GameDev Toolkit dev servers...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8010" ^| findstr "LISTENING"') do (
  echo Stopping backend process %%a
  taskkill /PID %%a /F
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo Stopping frontend process %%a
  taskkill /PID %%a /F
)

echo Done.
endlocal
