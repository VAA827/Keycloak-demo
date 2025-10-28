#!/bin/bash

# Keycloak Backup & Restore Script
# Ez a script exportálja a Keycloak realm-et és az összes konfigurációt

BACKUP_DIR="./keycloak-backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REALM_NAME="biometric-2fa"

echo "🔄 Keycloak Backup Script"
echo "========================="
echo ""

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Függvények
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Backup könyvtár létrehozása
mkdir -p "$BACKUP_DIR"

# 1. Realm Export (API-n keresztül)
echo "1️⃣  Realm exportálása..."

# Admin token megszerzése
TOKEN=$(curl -k -s -X POST "https://localhost:8443/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Admin token megszerzése sikertelen"
    exit 1
fi

print_success "Admin token megszerzve"

# Realm exportálása
EXPORT_FILE="$BACKUP_DIR/${REALM_NAME}-backup-${TIMESTAMP}.json"

curl -k -s -X POST "https://localhost:8443/admin/realms/${REALM_NAME}/partial-export?exportClients=true&exportGroupsAndRoles=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" > "$EXPORT_FILE"

if [ -s "$EXPORT_FILE" ]; then
    print_success "Realm exportálva: $EXPORT_FILE"
    FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
    echo "   Fájl méret: $FILE_SIZE"
else
    print_error "Realm export sikertelen"
    exit 1
fi

# 2. Docker Compose backup
echo ""
echo "2️⃣  Docker Compose konfiguráció mentése..."
cp docker-compose.yaml "$BACKUP_DIR/docker-compose-backup-${TIMESTAMP}.yaml"
print_success "Docker Compose mentve"

# 3. Angular konfiguráció backup
echo ""
echo "3️⃣  Angular app konfiguráció mentése..."
if [ -f "angular-app/src/app/app.config.ts" ]; then
    mkdir -p "$BACKUP_DIR/angular-config"
    cp angular-app/src/app/app.config.ts "$BACKUP_DIR/angular-config/app.config-backup-${TIMESTAMP}.ts"
    print_success "Angular config mentve"
fi

# 4. Dokumentációk backup
echo ""
echo "4️⃣  Dokumentációk összegyűjtése..."
DOCS_BACKUP="$BACKUP_DIR/docs-backup-${TIMESTAMP}"
mkdir -p "$DOCS_BACKUP"

for doc in *.md; do
    if [ -f "$doc" ]; then
        cp "$doc" "$DOCS_BACKUP/"
    fi
done

print_success "$(ls $DOCS_BACKUP/*.md 2>/dev/null | wc -l) dokumentum mentve"

# 5. PostgreSQL dump (opcionális, ha szükséges)
echo ""
echo "5️⃣  PostgreSQL adatbázis dump..."
docker exec keycloak-postgres pg_dump -U keycloak keycloak > "$BACKUP_DIR/postgres-dump-${TIMESTAMP}.sql" 2>/dev/null

if [ -s "$BACKUP_DIR/postgres-dump-${TIMESTAMP}.sql" ]; then
    print_success "PostgreSQL dump mentve"
    DB_SIZE=$(du -h "$BACKUP_DIR/postgres-dump-${TIMESTAMP}.sql" | cut -f1)
    echo "   Fájl méret: $DB_SIZE"
else
    print_warning "PostgreSQL dump kihagyva (opcionális)"
fi

# 6. Összegzés készítése
echo ""
echo "6️⃣  Backup összegzés készítése..."

cat > "$BACKUP_DIR/BACKUP-INFO-${TIMESTAMP}.txt" <<EOF
Keycloak Backup Információk
===========================

Backup időpontja: $(date)
Realm neve: ${REALM_NAME}

Mentett fájlok:
--------------
1. Realm export: ${REALM_NAME}-backup-${TIMESTAMP}.json
2. Docker Compose: docker-compose-backup-${TIMESTAMP}.yaml
3. Angular config: angular-config/app.config-backup-${TIMESTAMP}.ts
4. Dokumentációk: docs-backup-${TIMESTAMP}/
5. PostgreSQL dump: postgres-dump-${TIMESTAMP}.sql (opcionális)

Realm beállítások:
-----------------
- WebAuthn Policy: cross-platform (telefonos QR kódos)
- User Verification: required (biometrikus kötelező)
- Test felhasználó: testuser / Test123
- Admin: admin / admin123

Restore parancs:
---------------
bash restore.sh ${REALM_NAME}-backup-${TIMESTAMP}.json

Vagy manuálisan:
1. Keycloak Admin Console → Realm Settings → Action → Partial Import
2. Töltsd fel: ${REALM_NAME}-backup-${TIMESTAMP}.json
3. Válaszd ki mit importálsz (Users, Clients, Roles, etc.)
4. Import

Docker újraindítás:
------------------
docker-compose down
docker-compose up -d

Dokumentáció helye:
------------------
docs-backup-${TIMESTAMP}/
EOF

print_success "Backup összegzés létrehozva"

# 7. Összesítés
echo ""
echo "============================================"
echo "✅ Backup sikeresen elkészült!"
echo "============================================"
echo ""
echo "📁 Backup helye: $BACKUP_DIR"
echo ""
echo "Mentett fájlok:"
ls -lh "$BACKUP_DIR" | grep "${TIMESTAMP}" | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "💡 Restore: bash restore.sh ${REALM_NAME}-backup-${TIMESTAMP}.json"
echo ""

# Teljes backup méret
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "📦 Teljes backup méret: $TOTAL_SIZE"
