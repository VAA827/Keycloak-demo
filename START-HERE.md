# 🚀 START HERE - Keycloak 2FA Biometrikus Projekt

## 👋 Üdvözöllek!

Ez a projekt tartalmaz **mindent**, ami egy **production-ready Keycloak 2FA biometrikus hitelesítési** rendszerhez kell.

---

## 📦 Mi van ebben a projektben?

✅ **Keycloak 23.0.0** Docker környezetben
✅ **WebAuthn 2FA** biometrikus hitelesítéssel
✅ **Telefonos QR kódos** 2FA (ujjlenyomat/Face ID)
✅ **Angular app** integrációval
✅ **Teljes dokumentáció** magyar nyelven
✅ **Backup & Restore** scriptek
✅ **Admin REST API** példakódok

---

## 🎯 Gyors Indítás (5 perc)

### 1. Docker konténerek indítása

```bash
docker-compose up -d
```

Várd meg, amíg elindul (30-60 másodperc):
```bash
docker logs keycloak --follow
# Amikor látod: "Keycloak started in..." -> készen áll
```

### 2. Tesztelés

**Admin Console:**
```
https://localhost:8443/admin
Username: admin
Password: admin123
```

**Test felhasználó (Angular app):**
```
http://localhost:4200
Username: testuser
Password: Test123
```

**Első bejelentkezésnél:**
- Automatikusan megjelenik a **WebAuthn regisztráció**
- Válaszd a telefonos QR kódos opciót
- Olvasd be QR kódot a telefonoddal
- Biometrikus hitelesítés (ujjlenyomat/Face ID)
- Kész! ✅

---

## 📚 Dokumentációk (Start here!)

### 🎓 Kezdőknek

| Dokumentum | Mit tartalmaz | Időigény |
|------------|--------------|----------|
| **BIOMETRIC-2FA-SETUP.md** | Általános WebAuthn 2FA setup | 10 perc |
| **QR-CODE-2FA-SETUP.md** | Telefonos QR kódos 2FA részletesen | 10 perc |
| **SSL-CERT-SETUP.md** | SSL tanúsítvány kezelés és generálás | 15 perc |
| **README-BACKUP-RESTORE.md** | Backup & Restore gyors útmutató | 5 perc |

**👉 Kezdd itt:** `BIOMETRIC-2FA-SETUP.md`

---

### 🔧 Admin Felhasználóknak

| Dokumentum | Mit tartalmaz | Időigény |
|------------|--------------|----------|
| **ADMIN-CONSOLE-GUIDE.md** | Keycloak Admin Console teljes útmutató | 30 perc |
| **ADMIN-SOLUTIONS-SUMMARY.md** | Admin megoldások összehasonlítása | 15 perc |

**👉 Admin vagy?** Kezdd itt: `ADMIN-CONSOLE-GUIDE.md`

---

### 👨‍💻 Fejlesztőknek

| Dokumentum | Mit tartalmaz | Időigény |
|------------|--------------|----------|
| **CUSTOM-ADMIN-API.md** | REST API teljes dokumentáció + példakódok | 45 perc |
| **ANGULAR-ADMIN-COMPONENT-EXAMPLE.md** | Teljes Angular admin komponens példa | 60 perc |
| **SESSION-CHANGES-LOG.md** | Minden változás részletesen | 30 perc |

**👉 Fejlesztő vagy?** Kezdd itt: `CUSTOM-ADMIN-API.md`

---

## 🔐 WebAuthn 2FA Beállítások

### Beépített biometrikus (Windows Hello, Touch ID)

**Jellemzők:**
- 🖥️ Számítógépen beépített ujjlenyomat/arcfelismerés
- 🚀 Gyors és kényelmes
- 🔒 Biztonságos

**Beállítás:**
- Admin Console → Authentication → Policies → WebAuthn Policy
- Authenticator Attachment: **platform**
- User Verification: **required**

---

### Telefonos QR kódos (jelenleg aktív ✅)

**Jellemzők:**
- 📱 Telefonon biometrikus hitelesítés
- 📷 QR kód beolvasás
- 🌍 Cross-device támogatás

**Beállítás:**
- Authenticator Attachment: **cross-platform**
- User Verification: **required**

**Részletek:** `QR-CODE-2FA-SETUP.md`

---

### Bármelyik eszköz (univerzális)

**Jellemzők:**
- 🔑 USB Security Key (YubiKey)
- 📱 Telefon
- 🖥️ Beépített
- Mindegyik működik!

**Beállítás:**
- Authenticator Attachment: **not specified**
- User Verification: **preferred**

---

## 💾 Backup & Restore

### Gyors Backup

**Linux/Mac:**
```bash
bash backup-restore.sh
```

**Windows:**
```powershell
.\backup-restore.ps1
```

**Eredmény:**
```
keycloak-backup/
├── biometric-2fa-backup-TIMESTAMP.json  ← Realm export
├── docker-compose-backup-TIMESTAMP.yaml
├── angular-config/
├── docs-backup-TIMESTAMP/
└── BACKUP-INFO-TIMESTAMP.txt
```

### Gyors Restore

```bash
bash restore.sh keycloak-backup/biometric-2fa-backup-*.json
```

**Részletek:** `README-BACKUP-RESTORE.md`

---

## 🎛️ Admin Műveletek

### Keycloak Admin Console (GUI)

**Elérhető funkciók:**
- ✅ Felhasználók kezelése
- ✅ WebAuthn Policy módosítása
- ✅ 2FA kikényszerítése
- ✅ Authentication Flows szerkesztése
- ✅ Events & Audit Log
- ✅ Realm export/import

**URL:** https://localhost:8443/admin

**Részletes útmutató:** `ADMIN-CONSOLE-GUIDE.md`

---

### REST API (Programozható)

**Példa műveletek:**

```typescript
// Admin token
const token = await keycloakAdmin.login('admin', 'admin123');

// Felhasználók listázása
const users = await keycloakAdmin.getUsers();

// 2FA kikényszerítése
await keycloakAdmin.requireWebAuthn(userId);

// WebAuthn Policy módosítása
await keycloakAdmin.updateWebAuthnPolicy({
  authenticatorAttachment: 'cross-platform',
  userVerification: 'required'
});
```

**Teljes API dokumentáció:** `CUSTOM-ADMIN-API.md`

---

### Egyedi Angular Admin UI

**Funkciók:**
- 🎨 Saját brand & design
- 🎛️ WebAuthn Policy preset gombok
- 👥 Felhasználók kezelése
- 📱 Eszközök listázása & törlése
- ⚡ Real-time frissítés

**Teljes példakód:** `ANGULAR-ADMIN-COMPONENT-EXAMPLE.md`

---

## 🧪 Tesztelési Forgatókönyvek

### 1. Alapvető bejelentkezés

```
1. Nyisd meg: http://localhost:4200
2. Kattints Login
3. Username: testuser, Password: Test123
4. WebAuthn regisztráció (első alkalom)
5. Biometrikus hitelesítés
6. ✅ Beléptél!
```

### 2. Telefonos QR kódos 2FA

```
1. Számítógépen: bejelentkezés jelszóval
2. QR kód megjelenik
3. Telefonon: kamera app / Chrome
4. QR kód beolvasás
5. Telefonon: biometrikus hitelesítés
6. ✅ Számítógépen automatikusan belépsz
```

### 3. WebAuthn eszköz törlése (support use case)

```
1. Admin Console → Users → testuser
2. Credentials fül
3. WebAuthn credential törlése (piros X)
4. Required Actions fül → "webauthn-register"
5. ✅ Következő bejelentkezéskor újra regisztrálja
```

---

## 🗂️ Projekt Struktúra

```
my-keycloak-project/
├── 📁 angular-app/              # Angular frontend
│   └── src/app/app.config.ts   # Keycloak config
│
├── 📁 backend/                  # Backend (ha van)
│
├── 📁 certs/                    # SSL tanúsítványok
│
├── 📁 keycloak-backup/          # Backupok
│   ├── biometric-2fa-realm.json
│   └── biometric-2fa-realm-CURRENT-EXPORT-*.json
│
├── 📄 docker-compose.yaml       # Docker konfiguráció
│
├── 📄 backup-restore.sh         # Backup script (Bash)
├── 📄 backup-restore.ps1        # Backup script (PowerShell)
├── 📄 restore.sh                # Restore script
│
└── 📚 Dokumentációk:
    ├── START-HERE.md                         ← Te itt vagy! 👈
    ├── BIOMETRIC-2FA-SETUP.md                # 2FA setup
    ├── QR-CODE-2FA-SETUP.md                  # QR kódos 2FA
    ├── ADMIN-CONSOLE-GUIDE.md                # Admin GUI
    ├── CUSTOM-ADMIN-API.md                   # REST API
    ├── ANGULAR-ADMIN-COMPONENT-EXAMPLE.md    # Angular példa
    ├── ADMIN-SOLUTIONS-SUMMARY.md            # Összehasonlítás
    ├── README-BACKUP-RESTORE.md              # Backup útmutató
    └── SESSION-CHANGES-LOG.md                # Változások log
```

---

## 🔧 Gyakori Feladatok (Cheat Sheet)

### Docker Műveletek

```bash
# Indítás
docker-compose up -d

# Újraindítás
docker-compose restart

# Leállítás
docker-compose down

# Logok
docker logs keycloak --follow
docker logs keycloak-postgres --follow

# Státusz
docker ps
```

### Keycloak API (curl)

```bash
# Admin token
curl -k -X POST https://localhost:8443/realms/master/protocol/openid-connect/token \
  -d "username=admin&password=admin123&grant_type=password&client_id=admin-cli"

# Realm info
curl -k https://localhost:8443/realms/biometric-2fa

# Felhasználók
curl -k -H "Authorization: Bearer $TOKEN" \
  https://localhost:8443/admin/realms/biometric-2fa/users
```

### Backup & Restore

```bash
# Backup
bash backup-restore.sh

# Restore
bash restore.sh keycloak-backup/biometric-2fa-backup-*.json

# Lista backupokról
ls -lh keycloak-backup/
```

---

## 🆘 Hibaelhárítás

### "Page not found" az Angular app-ban

**Ok:** Rossz realm név az Angular configban

**Megoldás:**
```typescript
// angular-app/src/app/app.config.ts
realm: 'biometric-2fa'  // Ellenőrizd!
```

### "Keycloak not responding"

```bash
# Ellenőrizd a konténert
docker ps | grep keycloak

# Nézd a logokat
docker logs keycloak --tail 50

# Újraindítás
docker-compose restart keycloak
```

### "WebAuthn regisztráció nem jelenik meg"

**Ellenőrzések:**
1. ✅ HTTPS használat? (https://localhost:8443)
2. ✅ Böngésző támogatja? (Chrome/Edge ajánlott)
3. ✅ Windows Hello / Touch ID beállítva?
4. ✅ Required action beállítva? (Admin Console → Users → testuser → Required Actions)

### "Admin token unauthorized (401)"

**Ok:** Token lejárt (60 másodperc után)

**Megoldás:** Kérj új token-t minden API hívás előtt

---

## 📊 Mit érdemes tudni

### Felhasználói Fiókok

| Username | Password | Role | 2FA |
|----------|----------|------|-----|
| admin | admin123 | Admin | Nincs |
| testuser | Test123 | User | WebAuthn |

### URL-ek

| Szolgáltatás | URL | Port |
|-------------|-----|------|
| Keycloak Admin | https://localhost:8443/admin | 8443 |
| Keycloak Account | https://localhost:8443/realms/biometric-2fa/account | 8443 |
| Angular App | http://localhost:4200 | 4200 |
| PostgreSQL | localhost | 5432 |

### Realm Beállítások

| Beállítás | Érték |
|-----------|-------|
| Realm név | biometric-2fa |
| WebAuthn Policy | cross-platform |
| User Verification | required |
| Brute Force védelem | ✅ Enabled (5 tries) |
| Session timeout | 30 perc (idle) |
| Nyelv | Magyar (HU) |

---

## 🎓 Következő Lépések

### Ha új vagy a Keycloak-ban:

1. **Olvasd el:** `BIOMETRIC-2FA-SETUP.md`
2. **Próbáld ki:** A test felhasználóval bejelentkezés
3. **Nézd meg:** Admin Console-t (`ADMIN-CONSOLE-GUIDE.md`)

### Ha admin vagy:

1. **Olvasd el:** `ADMIN-CONSOLE-GUIDE.md`
2. **Teszteld:** Felhasználók kezelése, 2FA beállítások
3. **Készíts:** Backup-ot (`backup-restore.sh`)

### Ha fejlesztő vagy:

1. **Olvasd el:** `CUSTOM-ADMIN-API.md`
2. **Implementáld:** REST API integrációt
3. **Készíts:** Egyedi admin UI-t (`ANGULAR-ADMIN-COMPONENT-EXAMPLE.md`)

---

## 💡 Pro Tippek

1. **Backup mindent rendszeresen** - használd a `backup-restore.sh` scriptet
2. **Teszteld a restore-t** - legalább egyszer próbáld ki
3. **Ne commitolj backup fájlokat** - `.gitignore` tartalmazza őket
4. **Production-ban:** Változtasd meg az admin jelszót!
5. **Token management:** Használj refresh token-t hosszú műveletekhez
6. **Monitoring:** Nézd az Events-et az Admin Console-ban

---

## 📞 Support

**Dokumentációk:**
- Mind a 9 dokumentum megtalálható a projekt gyökerében
- Kezdd a `START-HERE.md`-vel (ez a fájl)

**Keycloak hivatalos docs:**
- https://www.keycloak.org/documentation

**WebAuthn:**
- https://webauthn.guide/
- https://fidoalliance.org/

---

## ✅ Checklist - Mi működik?

- ✅ Keycloak 23.0.0 Docker környezetben
- ✅ PostgreSQL adatbázis
- ✅ HTTPS (self-signed cert)
- ✅ Biometric 2FA realm
- ✅ WebAuthn cross-platform policy
- ✅ Test felhasználó (testuser / Test123)
- ✅ Angular app integráció
- ✅ Telefonos QR kódos 2FA
- ✅ Backup & Restore scriptek
- ✅ 9 dokumentum magyarul
- ✅ Admin REST API példák
- ✅ Brute force védelem
- ✅ Event logging

---

**🎉 Minden működik! Kezdj hozzá!**

**Első lépés:** Olvasd el a `BIOMETRIC-2FA-SETUP.md` dokumentumot és próbáld ki a bejelentkezést!

---

**Utolsó frissítés:** 2025-10-28
