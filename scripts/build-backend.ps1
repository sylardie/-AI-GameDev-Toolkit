$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $python)) {
  throw "Backend virtual environment not found: $python"
}

Push-Location $backend
try {
  & $python -m pip install -r requirements.txt -r requirements-build.txt
  & $python -m unittest discover -s tests -v
  & $python -m PyInstaller `
    --noconfirm `
    --clean `
    --onedir `
    --name ai-gamedev-backend `
    --collect-all imageio_ffmpeg `
    --add-data "app\modules\design_generator\templates;app\modules\design_generator\templates" `
    launcher.py
} finally {
  Pop-Location
}
