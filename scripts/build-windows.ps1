$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontend = Join-Path $root "frontend"
$release = Join-Path $frontend "artifacts"
$staging = Join-Path $env:TEMP "ai-gamedev-toolkit-release"

Push-Location $frontend
try {
  npm.cmd run build
  npm.cmd run backend:build

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

Write-Host "Windows release artifacts: $release"
