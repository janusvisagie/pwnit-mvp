param(
  [switch]$NoBackup
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$configPath = Join-Path $PSScriptRoot 'db-targets.json'
if (-not (Test-Path $configPath)) {
  throw "Missing scripts/db-targets.json. Create it from scripts/db-targets.example.json first."
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.live.databaseUrl) {
  throw "db-targets.json does not contain live.databaseUrl"
}

$envPath = Join-Path $root '.env'
$envLocalPath = Join-Path $root '.env.local'
$backupDir = Join-Path $root 'tmp/env-switch-backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not $NoBackup) {
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  if (Test-Path $envPath) {
    Copy-Item $envPath (Join-Path $backupDir ".env.$timestamp.bak") -Force
  }
  if (Test-Path $envLocalPath) {
    Copy-Item $envLocalPath (Join-Path $backupDir ".env.local.$timestamp.bak") -Force
  }
}

$db = [string]$config.live.databaseUrl
$content = @(
  "DATABASE_URL=\"$db\""
  "POSTGRES_URL=\"$db\""
  "PRISMA_DATABASE_URL=\"$db\""
) -join "`r`n"

Set-Content -Path $envPath -Value $content -NoNewline
Set-Content -Path $envLocalPath -Value $content -NoNewline

Write-Host "Switched .env and .env.local to LIVE database."
if (-not $NoBackup) {
  Write-Host "Backups saved in tmp/env-switch-backups"
}
