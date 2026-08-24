<#
    restore-backup.ps1
    -------------------
    Восстанавливает базу данных и файлы планов этажей из папки,
    созданной скриптом backup-and-deploy.ps1.

    ИСПОЛЬЗОВАНИЕ:
        .\restore-backup.ps1 -BackupFolder "2026-08-24_11-42-00"

    Список доступных бэкапов можно посмотреть так:
        Get-ChildItem .\backups

    ВНИМАНИЕ: операция перезаписывает текущую базу данных и файлы планов.
    Скрипт требует ручного подтверждения перед восстановлением.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFolder
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$path = Join-Path (Join-Path $root "backups") $BackupFolder
if (-not (Test-Path $path)) {
    throw "Папка бэкапа не найдена: $path"
}

$pgContainer   = "groriotechinventory-postgres-1"
$uploadsVolume = "groriotechinventory_uploads_data"

function Read-DotEnv {
    $vars = @{}
    $envPath = Join-Path $root ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$") {
                $vars[$matches[1]] = $matches[2]
            }
        }
    }
    return $vars
}

$envVars = Read-DotEnv
$dbUser = if ($envVars.ContainsKey("POSTGRES_USER")) { $envVars["POSTGRES_USER"] } else { "gti" }
$dbName = if ($envVars.ContainsKey("POSTGRES_DB"))   { $envVars["POSTGRES_DB"] }   else { "groiro_tech_inventory" }

Write-Host "==> Восстановление из: $path" -ForegroundColor Cyan
Write-Host "==> ВНИМАНИЕ: текущая база данных ($dbName) и файлы планов будут перезаписаны!" -ForegroundColor Red
$confirm = Read-Host "Введите 'yes' для подтверждения"
if ($confirm -ne "yes") {
    Write-Host "Отменено пользователем." -ForegroundColor Yellow
    exit 0
}

# --- 1. Восстановление БД ---
$dumpFile = Join-Path $path "db.sql"
if (Test-Path $dumpFile) {
    $pgRunning = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $pgContainer
    if (-not $pgRunning) {
        throw "Контейнер $pgContainer не запущен. Выполните 'docker compose up -d postgres' и повторите."
    }
    Write-Host "==> Восстановление БД из $dumpFile..." -ForegroundColor Cyan
    Get-Content $dumpFile -Raw | docker exec -i $pgContainer psql -U $dbUser -d $dbName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   !! psql вернул ошибку — проверьте вывод выше" -ForegroundColor Yellow
    } else {
        Write-Host "   OK: база восстановлена" -ForegroundColor Green
    }
} else {
    Write-Host "Файл db.sql не найден в бэкапе — восстановление БД пропущено." -ForegroundColor Yellow
}

# --- 2. Восстановление файлов планов этажей ---
$uploadsArchive = Join-Path $path "uploads.tar"
if (Test-Path $uploadsArchive) {
    Write-Host "==> Восстановление uploads..." -ForegroundColor Cyan
    docker run --rm `
        -v "${uploadsVolume}:/data" `
        -v "${path}:/backup" `
        alpine sh -c "rm -rf /data/* && tar -xf /backup/uploads.tar -C /data"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   !! Не удалось восстановить uploads" -ForegroundColor Yellow
    } else {
        Write-Host "   OK: файлы восстановлены" -ForegroundColor Green
    }
} else {
    Write-Host "Файл uploads.tar не найден в бэкапе — восстановление файлов пропущено." -ForegroundColor Yellow
}

Write-Host "==> Восстановление завершено." -ForegroundColor Green
Write-Host "Рекомендуется перезапустить backend: docker compose restart backend" -ForegroundColor Cyan
