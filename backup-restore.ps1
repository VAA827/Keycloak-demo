# Keycloak Backup Script - Windows PowerShell verzió

$BackupDir = "./keycloak-backup"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$RealmName = "biometric-2fa"
$KeycloakUrl = "https://localhost:8443"

Write-Host "🔄 Keycloak Backup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Backup könyvtár létrehozása
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# 1. Admin token megszerzése
Write-Host "1️⃣  Admin token megszerzése..." -ForegroundColor Yellow

$Body = @{
    username = "admin"
    password = "admin123"
    grant_type = "password"
    client_id = "admin-cli"
}

try {
    $TokenResponse = Invoke-RestMethod -Uri "$KeycloakUrl/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -Body $Body `
        -ContentType "application/x-www-form-urlencoded" `
        -SkipCertificateCheck

    $Token = $TokenResponse.access_token
    Write-Host "✓ Admin token megszerzve" -ForegroundColor Green
}
catch {
    Write-Host "✗ Admin token megszerzése sikertelen" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 2. Realm exportálása
Write-Host ""
Write-Host "2️⃣  Realm exportálása..." -ForegroundColor Yellow

$ExportFile = "$BackupDir\$RealmName-backup-$Timestamp.json"

$Headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/json"
}

try {
    $RealmData = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$RealmName/partial-export?exportClients=true&exportGroupsAndRoles=true" `
        -Method Post `
        -Headers $Headers `
        -SkipCertificateCheck

    $RealmData | ConvertTo-Json -Depth 100 | Out-File -FilePath $ExportFile -Encoding UTF8

    $FileSize = (Get-Item $ExportFile).Length / 1KB
    Write-Host "✓ Realm exportálva: $ExportFile" -ForegroundColor Green
    Write-Host "   Fájl méret: $([math]::Round($FileSize, 2)) KB" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Realm export sikertelen" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 3. Docker Compose backup
Write-Host ""
Write-Host "3️⃣  Docker Compose konfiguráció mentése..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yaml") {
    Copy-Item "docker-compose.yaml" "$BackupDir\docker-compose-backup-$Timestamp.yaml"
    Write-Host "✓ Docker Compose mentve" -ForegroundColor Green
}

# 4. Angular konfiguráció backup
Write-Host ""
Write-Host "4️⃣  Angular app konfiguráció mentése..." -ForegroundColor Yellow

if (Test-Path "angular-app/src/app/app.config.ts") {
    $AngularConfigDir = "$BackupDir\angular-config"
    if (-not (Test-Path $AngularConfigDir)) {
        New-Item -ItemType Directory -Path $AngularConfigDir | Out-Null
    }

    Copy-Item "angular-app/src/app/app.config.ts" "$AngularConfigDir\app.config-backup-$Timestamp.ts"
    Write-Host "✓ Angular config mentve" -ForegroundColor Green
}

# 5. Dokumentációk backup
Write-Host ""
Write-Host "5️⃣  Dokumentációk összegyűjtése..." -ForegroundColor Yellow

$DocsBackupDir = "$BackupDir\docs-backup-$Timestamp"
New-Item -ItemType Directory -Path $DocsBackupDir | Out-Null

$DocFiles = Get-ChildItem -Path "." -Filter "*.md"
foreach ($Doc in $DocFiles) {
    Copy-Item $Doc.FullName "$DocsBackupDir\"
}

Write-Host "✓ $($DocFiles.Count) dokumentum mentve" -ForegroundColor Green

# 6. PostgreSQL dump (opcionális)
Write-Host ""
Write-Host "6️⃣  PostgreSQL adatbázis dump..." -ForegroundColor Yellow

try {
    docker exec keycloak-postgres pg_dump -U keycloak keycloak > "$BackupDir\postgres-dump-$Timestamp.sql" 2>$null

    if (Test-Path "$BackupDir\postgres-dump-$Timestamp.sql") {
        $DbSize = (Get-Item "$BackupDir\postgres-dump-$Timestamp.sql").Length / 1KB
        Write-Host "✓ PostgreSQL dump mentve" -ForegroundColor Green
        Write-Host "   Fájl méret: $([math]::Round($DbSize, 2)) KB" -ForegroundColor Gray
    }
}
catch {
    Write-Host "⚠ PostgreSQL dump kihagyva (opcionális)" -ForegroundColor Yellow
}

# 7. Backup összegzés
Write-Host ""
Write-Host "7️⃣  Backup összegzés készítése..." -ForegroundColor Yellow

$BackupInfo = @"
Keycloak Backup Információk
===========================

Backup időpontja: $(Get-Date)
Realm neve: $RealmName

Mentett fájlok:
--------------
1. Realm export: $RealmName-backup-$Timestamp.json
2. Docker Compose: docker-compose-backup-$Timestamp.yaml
3. Angular config: angular-config/app.config-backup-$Timestamp.ts
4. Dokumentációk: docs-backup-$Timestamp/
5. PostgreSQL dump: postgres-dump-$Timestamp.sql (opcionális)

Realm beállítások:
-----------------
- WebAuthn Policy: cross-platform (telefonos QR kódos)
- User Verification: required (biometrikus kötelező)
- Test felhasználó: testuser / Test123
- Admin: admin / admin123

Restore parancs (PowerShell):
----------------------------
.\restore.ps1 $RealmName-backup-$Timestamp.json

Vagy manuálisan:
1. Keycloak Admin Console → Realm Settings → Action → Partial Import
2. Töltsd fel: $RealmName-backup-$Timestamp.json
3. Válaszd ki mit importálsz (Users, Clients, Roles, etc.)
4. Import

Docker újraindítás:
------------------
docker-compose down
docker-compose up -d

Dokumentáció helye:
------------------
docs-backup-$Timestamp/
"@

$BackupInfo | Out-File "$BackupDir\BACKUP-INFO-$Timestamp.txt" -Encoding UTF8
Write-Host "✓ Backup összegzés létrehozva" -ForegroundColor Green

# 8. Összesítés
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Backup sikeresen elkészült!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Backup helye: $BackupDir"
Write-Host ""
Write-Host "Mentett fájlok:"
Get-ChildItem $BackupDir | Where-Object { $_.Name -like "*$Timestamp*" } | ForEach-Object {
    $Size = if ($_.PSIsContainer) { "-" } else { "$([math]::Round($_.Length / 1KB, 2)) KB" }
    Write-Host "   $($_.Name) ($Size)"
}
Write-Host ""
Write-Host "💡 Restore: .\restore.ps1 $RealmName-backup-$Timestamp.json"
Write-Host ""

# Teljes backup méret
$TotalSize = (Get-ChildItem $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "📦 Teljes backup méret: $([math]::Round($TotalSize, 2)) MB"
