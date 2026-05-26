param(
  [string]$OutputDir = "CODE-DNA-PTERODACTYL"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$target = Join-Path $scriptDir $OutputDir
$targetFull = [System.IO.Path]::GetFullPath($target)
$allowedRoot = [System.IO.Path]::GetFullPath($scriptDir)

if (-not $targetFull.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside deployment/pterodactyl: $targetFull"
}

$excludedNames = @(
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "venv"
)

$excludedFiles = @(
  ".env",
  ".env.local",
  "dev.db",
  "prod.db"
)

function Should-Skip {
  param([System.IO.FileSystemInfo]$Item)

  if ($excludedNames -contains $Item.Name) {
    return $true
  }

  if (-not $Item.PSIsContainer -and $excludedFiles -contains $Item.Name) {
    return $true
  }

  if (-not $Item.PSIsContainer -and $Item.Extension -eq ".pyc") {
    return $true
  }

  return $false
}

function Copy-Filtered {
  param(
    [string]$Source,
    [string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
    if (Should-Skip $_) {
      return
    }

    $destPath = Join-Path $Destination $_.Name
    if ($_.PSIsContainer) {
      Copy-Filtered -Source $_.FullName -Destination $destPath
    } else {
      Copy-Item -LiteralPath $_.FullName -Destination $destPath -Force
    }
  }
}

if (Test-Path -LiteralPath $targetFull) {
  Remove-Item -LiteralPath $targetFull -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $targetFull | Out-Null

Copy-Filtered -Source (Join-Path $repoRoot "backend") -Destination (Join-Path $targetFull "backend")
Copy-Filtered -Source (Join-Path $repoRoot "frontend") -Destination (Join-Path $targetFull "frontend")
Copy-Filtered -Source (Join-Path $repoRoot "engine") -Destination (Join-Path $targetFull "engine")
Copy-Filtered -Source (Join-Path $scriptDir "single-server") -Destination (Join-Path $targetFull "deployment\pterodactyl\single-server")
Copy-Item -LiteralPath (Join-Path $scriptDir "README.md") -Destination (Join-Path $targetFull "deployment\pterodactyl\README.md") -Force
Copy-Item -LiteralPath (Join-Path $scriptDir "UPLOAD_MANIFEST.md") -Destination (Join-Path $targetFull "deployment\pterodactyl\UPLOAD_MANIFEST.md") -Force
Copy-Item -LiteralPath (Join-Path $scriptDir ".deployignore") -Destination (Join-Path $targetFull "deployment\pterodactyl\.deployignore") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "README.md") -Destination (Join-Path $targetFull "README.md") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "TEST_REPORT.md") -Destination (Join-Path $targetFull "TEST_REPORT.md") -Force

$bundleReadme = @'
# CodeDNA Pterodactyl Single-Folder Bundle

Upload this whole folder to your Pterodactyl server.

Install command:

```bash
bash deployment/pterodactyl/single-server/install.sh
```

Startup command:

```bash
bash deployment/pterodactyl/single-server/start.sh
```

Set environment variables from:

```text
deployment/pterodactyl/single-server/.env.example
```
'@

$bundleReadme | Set-Content -LiteralPath (Join-Path $targetFull "UPLOAD_THIS_FOLDER.md") -Encoding UTF8

Write-Host "Prepared deploy folder:"
Write-Host $targetFull
