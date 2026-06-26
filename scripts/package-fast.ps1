param(
  [switch]$RebuildBackend
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontend = Join-Path $root "frontend"
$backendExe = Join-Path $root "backend\dist\ai-gamedev-backend\ai-gamedev-backend.exe"
$release = Join-Path $frontend "artifacts"
$staging = Join-Path $env:TEMP "ai-gamedev-toolkit-fast-release"

if ($RebuildBackend) {
  Push-Location $frontend
  try {
    npm.cmd run backend:build
  } finally {
    Pop-Location
  }
} elseif (-not (Test-Path -LiteralPath $backendExe)) {
  throw "Packaged backend not found. Run with -RebuildBackend or run npm.cmd run dist:win once."
}

Push-Location $frontend
try {
  npm.cmd run build

  if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
  }

  npx.cmd electron-builder --win nsis portable --config.directories.output="$staging"

  if (Test-Path -LiteralPath $release) {
    Remove-Item -LiteralPath $release -Recurse -Force
  }
  New-Item -ItemType Directory -Path $release | Out-Null
  Copy-Item -Path (Join-Path $staging "*") -Destination $release -Recurse -Force
} finally {
  Pop-Location
}

Write-Host "Fast Windows release artifacts: $release"
