param(
  [string]$Version = "5.0.14.1"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$targetDir = Join-Path $repoRoot "desktop/bin/redis/windows"
$tempZip = Join-Path $env:TEMP "redis-windows-$Version.zip"
$downloadUrl = "https://github.com/tporadowski/redis/releases/download/v$Version/Redis-x64-$Version.zip"

Write-Host "[desktop] Redis 下载地址: $downloadUrl"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip
Expand-Archive -LiteralPath $tempZip -DestinationPath $targetDir -Force
Remove-Item -Force $tempZip

$redisExe = Join-Path $targetDir "redis-server.exe"
if (-not (Test-Path $redisExe)) {
  throw "[desktop] 下载完成但未找到 redis-server.exe，目标目录: $targetDir"
}

Write-Host "[desktop] Redis 准备完成: $redisExe"
