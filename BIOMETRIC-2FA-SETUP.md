# Keycloak Biometrikus 2FA Beállítás

## Áttekintés

Ez a konfiguráció beállít egy Keycloak realm-et WebAuthn alapú biometrikus kétfaktoros hitelesítéssel (2FA). A WebAuthn támogatja:

- **Ujjlenyomat olvasó** (fingerprint)
- **Arcfelismerés** (Face ID, Windows Hello)
- **Biztonsági kulcsok** (YubiKey, USB Security Keys)
- **Platform authenticators** (beépített eszköz hitelesítők)

## Konfiguráció részletei

### Létrehozott Realm: `biometric-2fa`

- **Realm neve**: biometric-2fa
- **Admin felhasználó**: admin / admin123
- **Test felhasználó**: testuser / Test123!
- **Alapértelmezett nyelv**: Magyar (HU)

### WebAuthn Beállítások

#### 2FA WebAuthn (második faktor)
- **Signature algoritmusok**: ES256, RS256
- **Authenticator attachment**: not specified (bármilyen eszköz)
- **User verification**: preferred
- **Resident key**: nem kötelező

#### Passwordless WebAuthn
- **Signature algoritmusok**: ES256, RS256
- **Authenticator attachment**: platform (beépített eszköz előnyben)
- **User verification**: required (kötelező)
- **Resident key**: Yes

## Használat

### 1. Keycloak indítása

```bash
docker-compose up -d
```

A Keycloak automatikusan importálja a `biometric-2fa` realm-et indításkor.

### 2. Admin felület elérése

1. Nyisd meg: https://localhost:8443
2. Jelentkezz be admin hitelesítő adatokkal:
   - Username: `admin`
   - Password: `admin123`

### 3. Biometrikus hitelesítés regisztrálása

#### Teszt felhasználóként:

1. Jelentkezz ki az admin felületről
2. Jelentkezz be test felhasználóként:
   - Username: `testuser`
   - Password: `Test123!`

3. **Első bejelentkezésnél** automatikusan megjelenik a WebAuthn regisztrációs képernyő:
   - Kattints a "Register" gombra
   - A böngésző kérni fogja a biometrikus hitelesítést
   - Használd az ujjlenyomat olvasót, Face ID-t vagy másik támogatott eszközt

4. **Sikeres regisztráció után**:
   - A következő bejelentkezésekkor először jelszó
   - Majd biometrikus hitelesítés szükséges

### 4. Authentication Flow

A `browser with webauthn` flow a következő lépéseket tartalmazza:

```
1. Cookie Authentication (ha már be vagy jelentkezve)
   ↓ (ALTERNATIVE)
2. Identity Provider Redirector
   ↓ (ALTERNATIVE)
3. Forms with WebAuthn
   ├─ Username & Password (REQUIRED)
   └─ WebAuthn 2FA (CONDITIONAL)
      ├─ User configured check
      └─ WebAuthn authenticator
```

### 5. Új felhasználó létrehozása biometrikus 2FA-val

**Admin felületen keresztül:**

1. Menj a Keycloak Admin Console → Users
2. Kattints "Add user"
3. Töltsd ki az adatokat
4. "Required Actions" résznél válaszd ki:
   - `webauthn-register` - kötelező WebAuthn regisztráció

5. Credentials fülön állíts be jelszót

6. **Első bejelentkezéskor** a felhasználónak regisztrálnia kell a biometrikus eszközét

### 6. Client konfiguráció (Angular App)

A `angular-app` client már elő van konfigurálva:

```json
{
  "clientId": "angular-app",
  "redirectUris": [
    "http://localhost:4200/*",
    "https://localhost:4200/*"
  ],
  "webOrigins": [
    "http://localhost:4200",
    "https://localhost:4200"
  ],
  "publicClient": true,
  "pkce.code.challenge.method": "S256"
}
```

## Böngésző kompatibilitás

A WebAuthn a következő böngészőkben támogatott:

- ✅ **Chrome/Edge** 67+ (Windows Hello, Touch ID, USB keys)
- ✅ **Firefox** 60+ (USB keys)
- ✅ **Safari** 13+ (Touch ID, Face ID)
- ✅ **Opera** 54+

### Mobilon:
- ✅ **Chrome Android** 70+ (ujjlenyomat)
- ✅ **Safari iOS** 13+ (Face ID, Touch ID)

## Biztonsági beállítások

### Brute Force védelem
- Maximum 5 sikertelen próbálkozás
- 15 perces várakozás sikertelen próbálkozások után
- Minimum 60 másodperc gyors bejelentkezés ellenőrzés között

### Session beállítások
- Remember Me engedélyezve
- SSO session: alapértelmezett Keycloak beállítások

### Event Logging
- Login/Logout események naplózása
- Admin események naplózása részletekkel
- TOTP/WebAuthn események követése

## Hibaelhárítás

### "WebAuthn not supported" hiba
- Ellenőrizd, hogy HTTPS-t használsz (localhost kivételével)
- Ellenőrizd a böngésző kompatibilitást
- Frissítsd a böngészőt a legújabb verzióra

### Biometrikus eszköz nem elérhető
- Ellenőrizd, hogy az eszköz támogatja-e a biometrikus hitelesítést
- Windows: Windows Hello beállítások
- macOS: Touch ID / Face ID beállítások
- Android/iOS: Biometrikus beállítások az eszköz beállításaiban

### USB Security Key nem működik
- Ellenőrizd, hogy a kulcs FIDO2/WebAuthn kompatibilis
- Próbálj másik USB portot
- Néhány böngésző engedélyt kér USB eszköz használatához

## Tesztelés

### 1. Biometrikus hitelesítés tesztelése

```bash
# Első bejelentkezés (csak jelszó)
curl -X POST https://localhost:8443/realms/biometric-2fa/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=angular-app" \
  -d "username=testuser" \
  -d "password=Test123!" \
  -d "grant_type=password"
```

### 2. WebAuthn eszköz státusz ellenőrzése

Admin felületen:
1. Users → testuser
2. Credentials fül
3. Látnod kell a regisztrált WebAuthn eszközöket

## További információk

### Dokumentáció
- [Keycloak WebAuthn dokumentáció](https://www.keycloak.org/docs/latest/server_admin/#webauthn)
- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)

### Realm Export/Import
A realm konfiguráció exportálásához:

```bash
# Konténeren belül
docker exec -it keycloak /opt/keycloak/bin/kc.sh export \
  --dir /opt/keycloak/data/export \
  --realm biometric-2fa
```

## Következő lépések

1. **Testreszabás**: Módosítsd a realm beállításokat igényeid szerint
2. **Email konfiguráció**: Állíts be SMTP szervert email verifikációhoz
3. **Theme**: Készíts egyedi témát a bejelentkezési oldalhoz
4. **Több Client**: Adj hozzá további alkalmazásokat
5. **Identity Providers**: Integráld a Google, Facebook, stb. bejelentkezést

## Kapcsolat

Ha kérdésed van vagy problémába ütközöl, ellenőrizd a Keycloak logokat:

```bash
docker logs keycloak
```
