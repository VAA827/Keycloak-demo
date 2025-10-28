#!/bin/bash

# Keycloak Restore Script
# Ez a script visszaállítja a Keycloak realm-et egy backup fájlból

BACKUP_DIR="./keycloak-backup"
REALM_NAME="biometric-2fa"

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "🔄 Keycloak Restore Script"
echo "=========================="
echo ""

# Paraméter ellenőrzés
if [ -z "$1" ]; then
    echo "Használat: bash restore.sh <backup-fájl.json>"
    echo ""
    echo "Elérhető backup fájlok:"
    ls -1 "$BACKUP_DIR"/*backup*.json 2>/dev/null | sed 's/.*\//   /'
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Ellenőrzés: teljes vagy relatív útvonal
if [ ! -f "$BACKUP_FILE" ]; then
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        print_error "Backup fájl nem található: $BACKUP_FILE"
        exit 1
    fi
fi

print_info "Backup fájl: $BACKUP_FILE"
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "   Fájl méret: $FILE_SIZE"
echo ""

# Megerősítés kérése
read -p "⚠️  Figyelem! Ez törli a jelenlegi realm-et és felülírja a backup-pal. Folytatod? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Restore megszakítva"
    exit 0
fi

# 1. Realm törlése (opcionális)
echo ""
echo "1️⃣  Jelenlegi realm törlése..."

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

# Realm törlése
RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" -X DELETE \
  "https://localhost:8443/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer $TOKEN")

if [ "$RESPONSE" = "204" ]; then
    print_success "Régi realm törölve"
elif [ "$RESPONSE" = "404" ]; then
    print_info "Realm nem létezett (első telepítés)"
else
    print_warning "Realm törlése kihagyva (HTTP $RESPONSE)"
fi

sleep 2

# 2. Új realm importálása
echo ""
echo "2️⃣  Realm importálása backup fájlból..."

# Új token, mert a régi lehet, hogy lejárt
TOKEN=$(curl -k -s -X POST "https://localhost:8443/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Realm import
RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST \
  "https://localhost:8443/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$BACKUP_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_success "Realm sikeresen importálva!"
else
    print_error "Realm import sikertelen (HTTP $HTTP_CODE)"
    echo "Válasz: $(echo "$RESPONSE" | head -n-1)"

    echo ""
    print_info "Alternatív megoldás: Manuális import"
    echo "1. Nyisd meg: https://localhost:8443/admin"
    echo "2. Válts a 'master' realm-re"
    echo "3. Menj: Realm Settings → Action → Partial Import"
    echo "4. Töltsd fel: $BACKUP_FILE"
    echo "5. Válaszd ki mit importálsz"
    echo "6. Kattints 'Import'"
    exit 1
fi

# 3. Realm beállítások ellenőrzése
echo ""
echo "3️⃣  Import ellenőrzése..."

sleep 2

# Realm lekérdezése
REALM_INFO=$(curl -k -s -X GET \
  "https://localhost:8443/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer $TOKEN")

if echo "$REALM_INFO" | grep -q "\"realm\":\"${REALM_NAME}\""; then
    print_success "Realm létrehozva és elérhető"

    # Felhasználók száma
    USERS_COUNT=$(curl -k -s -X GET \
      "https://localhost:8443/admin/realms/${REALM_NAME}/users/count" \
      -H "Authorization: Bearer $TOKEN")

    print_info "Felhasználók száma: $USERS_COUNT"

    # WebAuthn Policy ellenőrzése
    WEBAUTHN_POLICY=$(echo "$REALM_INFO" | grep -o '"webAuthnPolicyAuthenticatorAttachment":"[^"]*"' | cut -d'"' -f4)
    print_info "WebAuthn Policy: $WEBAUTHN_POLICY"
else
    print_error "Realm ellenőrzés sikertelen"
    exit 1
fi

# 4. Docker konfiguráció ellenőrzése
echo ""
echo "4️⃣  Docker konfiguráció ellenőrzése..."

if docker ps | grep -q keycloak; then
    print_success "Keycloak konténer fut"
else
    print_warning "Keycloak konténer nem fut"
    echo "   Indítás: docker-compose up -d"
fi

if docker ps | grep -q keycloak-postgres; then
    print_success "PostgreSQL konténer fut"
else
    print_warning "PostgreSQL konténer nem fut"
fi

# 5. Összegzés
echo ""
echo "============================================"
echo "✅ Restore sikeresen befejezve!"
echo "============================================"
echo ""
echo "📍 Keycloak Admin Console:"
echo "   https://localhost:8443/admin"
echo "   Admin: admin / admin123"
echo ""
echo "📍 Test felhasználó:"
echo "   Username: testuser"
echo "   Password: Test123"
echo ""
echo "📍 Angular App:"
echo "   http://localhost:4200"
echo ""
echo "🔐 WebAuthn 2FA:"
echo "   - Első bejelentkezéskor regisztráld a biometrikus eszközt"
echo "   - Támogatott: ujjlenyomat, Face ID, Windows Hello"
echo "   - Telefonos QR kódos módszer aktív"
echo ""
echo "📚 Dokumentáció:"
echo "   - BIOMETRIC-2FA-SETUP.md"
echo "   - QR-CODE-2FA-SETUP.md"
echo "   - ADMIN-CONSOLE-GUIDE.md"
echo ""

# Gyors teszt ajánlás
echo "🧪 Gyors teszt:"
echo "   curl -k https://localhost:8443/realms/${REALM_NAME}"
echo ""
