<#
    backup-and-deploy.ps1
    ----------------------
    Автоматический бэкап БД (pg_dump) и файлов планов этажей (volume uploads_data)
    перед пересборкой и запуском docker compose. По умолчанию СТАРЫЕ БЭКАПЫ
    НЕ УДАЛЯЮТСЯ — накапливаются в папке backups\ бессрочно.

    ИСПОЛЬЗОВАНИЕ (из PowerShell, находясь в папке проекта рядом с docker-compose.yml):

        .\backup-and-deploy.ps1                # бэкап + build + up, старые бэкапы не трогаются
        .\backup-and-deploy.ps1 -BackupOnly     # только бэкап, без пересборки
        .\backup-and-deploy.ps1 -SkipBackup     # пересборка без бэкапа (не рекомендуется)
        .\backup-and-deploy.ps1 -KeepBackups 20 # включить очистку: хранить последние 20, остальные удалять

    Если при первом запуске PowerShell ругается на политику выполнения скриптов,
    один раз выполните (от имени администратора):
        Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

    ВАЖНО: имена контейнера/пользователя/базы ниже подобраны по логам вашего
    проекта (groriotechinventory-postgres-1, groriotechinventory_uploads_data).
    Если в docker-compose.yml сервис Postgres называется иначе, либо
    POSTGRES_USER / POSTGRES_DB отличаются от указанных в .env — поправьте
    значения ниже ($pgContainer, $uploadsVolume, дефолты $dbUser/$dbName).
#>

param(
    [switch]$SkipBackup,
    [switch]$BackupOnly,
    [int]$KeepBackups = 0   # 0 = хранить все бэкапы бессрочно, ничего не удалять
)

$ErrorActionPreference = "Stop"

# Работаем относительно папки, где лежит сам скрипт
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$backupRoot = Join-Path $root "backups"
$timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$currentBackup = Join-Path $backupRoot $timestamp

# Имена контейнера и volume — поправьте, если у вас другие в docker-compose.yml
$pgContainer    = "groriotechinventory-postgres-1"
$uploadsVolume  = "groriotechinventory_uploads_data"

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

function Do-Backup {
    Write-Host "==> Создание бэкапа ($timestamp)" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $currentBackup -Force | Out-Null

    $envVars = Read-DotEnv
    $dbUser = if ($envVars.ContainsKey("POSTGRES_USER")) { $envVars["POSTGRES_USER"] } else { "gti" }
    $dbName = if ($envVars.ContainsKey("POSTGRES_DB"))   { $envVars["POSTGRES_DB"] }   else { "groiro_tech_inventory" }

    # --- 1. Дамп базы данных ---
    $pgRunning = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $pgContainer
    if ($pgRunning) {
        Write-Host "   -> Дамп PostgreSQL (user=$dbUser, db=$dbName)..."
        $dumpFile = Join-Path $currentBackup "db.sql"
        docker exec $pgContainer pg_dump -U $dbUser -d $dbName --clean --if-exists |
            Out-File -FilePath $dumpFile -Encoding utf8
        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump завершился с ошибкой. Проверьте имя пользователя/базы (см. .env) и имя контейнера ($pgContainer)."
        }
        $size = (Get-Item $dumpFile).Length
        Write-Host "      OK: $dumpFile ($size байт)" -ForegroundColor Green
    } else {
        Write-Host "   !! Контейнер $pgContainer не запущен — бэкап БД пропущен" -ForegroundColor Yellow
    }

    # --- 2. Бэкап файлов планов этажей (docker volume uploads_data) ---
    Write-Host "   -> Бэкап uploads ($uploadsVolume)..."
    $volumeExists = docker volume ls --format "{{.Name}}" | Select-String -SimpleMatch $uploadsVolume
    if ($volumeExists) {
        docker run --rm `
            -v "${uploadsVolume}:/data" `
            -v "${currentBackup}:/backup" `
            alpine tar -cf /backup/uploads.tar -C /data .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "      !! Не удалось заархивировать uploads" -ForegroundColor Yellow
        } else {
            Write-Host "      OK: $(Join-Path $currentBackup 'uploads.tar')" -ForegroundColor Green
        }
    } else {
        Write-Host "   !! Volume $uploadsVolume не найден — бэкап файлов пропущен (это нормально, если планов ещё нет)" -ForegroundColor Yellow
    }

    Write-Host "==> Бэкап завершён: $currentBackup" -ForegroundColor Green

    # --- 3. Ротация старых бэкапов (по умолчанию отключена) ---
    # Старые бэкапы НЕ удаляются автоматически. Если всё же нужно ограничить
    # их количество — запустите скрипт с параметром -KeepBackups N (N > 0).
    if ($KeepBackups -gt 0 -and (Test-Path $backupRoot)) {
        $allBackups = Get-ChildItem $backupRoot -Directory | Sort-Object Name -Descending
        if ($allBackups.Count -gt $KeepBackups) {
            $toDelete = $allBackups | Select-Object -Skip $KeepBackups
            foreach ($old in $toDelete) {
                Write-Host "   -> Удаление старого бэкапа: $($old.Name)" -ForegroundColor DarkGray
                Remove-Item $old.FullName -Recurse -Force
            }
        }
    }
}

# ===================== ОСНОВНОЙ ХОД СКРИПТА =====================

if (-not $SkipBackup) {
    Do-Backup
} else {
    Write-Host "==> Бэкап пропущен (-SkipBackup)" -ForegroundColor Yellow
}

if ($BackupOnly) {
    Write-Host "==> Режим -BackupOnly: пересборка не выполняется." -ForegroundColor Cyan
    exit 0
}

Write-Host "==> Сборка образов..." -ForegroundColor Cyan
docker compose build
if ($LASTEXITCODE -ne 0) { throw "Сборка завершилась с ошибкой" }

Write-Host "==> Запуск контейнеров..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "Запуск завершился с ошибкой" }

Write-Host "==> Готово!" -ForegroundColor Green
docker compose ps
