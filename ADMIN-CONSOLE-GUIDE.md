# Keycloak Admin Console - Teljes beállítási útmutató

## Elérés:

```
https://localhost:8443/admin
Admin: admin / admin123
```

## 1. Felhasználók kezelése (Users)

### A) Felhasználó létrehozása
1. **Users** menü → **Add user**
2. Töltsd ki:
   - Username
   - Email
   - First name / Last name
   - Email verified: ON
3. **Create**

### B) Jelszó beállítása
1. **Users** → Válaszd ki a felhasználót
2. **Credentials** fül
3. **Set password**
   - Új jelszó megadása
   - Temporary: OFF (ha nem ideiglenest akarsz)
4. **Save**

### C) 2FA beállítása felhasználónak
1. **Users** → Válaszd ki a felhasználót
2. **Required Actions** fül
3. Válaszd ki az akciót:
   - **Configure OTP** - TOTP (Google/Microsoft Authenticator)
   - **Webauthn Register** - Biometrikus (ujjlenyomat, Face ID)
   - **Webauthn Register Passwordless** - Jelszó nélküli belépés
4. **Save**

Következő bejelentkezéskor a felhasználó be kell állítsa a 2FA-t.

---

## 2. WebAuthn Beállítások (Authentication Policies)

### A) 2FA WebAuthn Policy (second factor)

**Útvonal:** Authentication → Policies → WebAuthn Policy

**Fontosabb beállítások:**

| Beállítás | Mit csinál | Értékek |
|-----------|-----------|---------|
| **Relying Party Entity Name** | Az alkalmazás neve a biometrikus eszközön | Pl: "My Company" |
| **Signature Algorithms** | Támogatott algoritmusok | ES256, RS256 (mindkettő ajánlott) |
| **Authenticator Attachment** | Milyen eszköz típus | **platform** = beépített (ujjlenyomat, Face ID)<br>**cross-platform** = külső (telefon, USB key)<br>**not specified** = mindkettő |
| **Require Resident Key** | Jelszó nélküli belépés | No = 2FA<br>Yes = passwordless |
| **User Verification Requirement** | Biometrikus kötelező? | **required** = kötelező PIN/biometrikus<br>**preferred** = kéri, de nem kötelező<br>**discouraged** = nem kéri |
| **Attestation Conveyance Preference** | Eszköz hitelesítés szintje | not specified (normál használat) |
| **Acceptable AAGUIDs** | Engedélyezett eszközök listája | Üres = minden eszköz OK |

**Példa beállítások:**

**Beépített biometrikus (ujjlenyomat/Face ID a számítógépen):**
```
Authenticator Attachment: platform
User Verification: required
```

**Telefonos QR kódos:**
```
Authenticator Attachment: cross-platform
User Verification: required
```

**Bármi mehet (USB key, telefon, beépített):**
```
Authenticator Attachment: not specified
User Verification: preferred
```

### B) Passwordless WebAuthn Policy

**Útvonal:** Authentication → Policies → WebAuthn Passwordless Policy

Ugyanazok a beállítások, de jelszó nélküli belépéshez.

**Ajánlott beállítás:**
```
Authenticator Attachment: platform
Require Resident Key: Yes
User Verification: required
```

---

## 3. Authentication Flow kezelése

### A) Meglévő flow másolása és módosítása

1. **Authentication → Flows**
2. Válaszd: **Browser**
3. Kattints: **Copy** (pl. "browser-with-2fa")
4. **Add execution** vagy **Add flow**
5. Húzd-vidd az elemeket sorrendbe

### B) WebAuthn 2FA flow beállítása

**Példa flow:**

```
Browser Flow
├─ Cookie (ALTERNATIVE)
├─ Identity Provider Redirector (ALTERNATIVE)
└─ Forms (ALTERNATIVE)
   ├─ Username Password Form (REQUIRED)
   └─ Browser - Conditional OTP/WebAuthn (CONDITIONAL)
      ├─ Condition - User Configured (REQUIRED)
      └─ WebAuthn Authenticator (REQUIRED)
```

**Execution actions:**
- **Add execution**: Új authenticator hozzáadása
- **Requirement szintek:**
  - REQUIRED = kötelező
  - ALTERNATIVE = valamelyik közülük kötelező
  - DISABLED = kikapcsolva
  - CONDITIONAL = feltételes

### C) Flow aktiválása

1. **Authentication → Bindings** fül
2. **Browser Flow** → Válaszd ki az új flow-t
3. **Save**

---

## 4. OTP/TOTP (Google/Microsoft Authenticator) beállítása

### A) OTP Policy beállítása

**Útvonal:** Authentication → Policies → OTP Policy

| Beállítás | Ajánlott érték | Mit csinál |
|-----------|---------------|-----------|
| **OTP Type** | Time-based (TOTP) | Időalapú vagy számláló alapú |
| **Algorithm** | SHA1 | Kompatibilis a legtöbb app-pal |
| **Number of Digits** | 6 | Kód hossza |
| **Look Ahead Window** | 1 | Időeltérés tűrése |
| **OTP Token Period** | 30 másodperc | Kód lejárati idő |

### B) Felhasználónak OTP beállítása

1. **Users** → felhasználó → **Required Actions**
2. Jelöld be: **Configure OTP**
3. Első bejelentkezéskor QR kódot kap, amit Google/Microsoft Authenticator-ban beolvas

---

## 5. Többféle 2FA egyszerre (User choice)

Lehet olyan flow-t készíteni, ahol a felhasználó választhat:

**Authentication → Flows → Új flow:**

```
Browser Flow
├─ Username Password (REQUIRED)
└─ 2FA Choice (ALTERNATIVE)
   ├─ OTP Form (ALTERNATIVE) → Google Authenticator
   ├─ WebAuthn Authenticator (ALTERNATIVE) → Ujjlenyomat
   └─ SMS OTP (ALTERNATIVE) → SMS kód
```

A felhasználó választhat, melyik 2FA módszert használja.

---

## 6. User Self-Service (Account Console)

A felhasználók saját maguk kezelhetik a 2FA eszközeiket:

**URL:** `https://localhost:8443/realms/biometric-2fa/account`

**Mit tud a felhasználó:**
- WebAuthn eszközök hozzáadása/törlése
- OTP újrakonfigurálása
- Jelszó változtatás
- Sessions megtekintése
- Personal info szerkesztése

**Account Console engedélyezése:**
1. **Realm Settings → Themes**
2. **Account Theme**: keycloak.v2 (modern) vagy account (régi)
3. **Save**

---

## 7. Gyakori adminisztrációs műveletek

### A) Felhasználó WebAuthn eszköz törlése

**Ha elvesztette a telefont / elfelejtette regisztrálni:**

1. **Users** → felhasználó
2. **Credentials** fül
3. Töröld a WebAuthn credential-t (piros X ikon)
4. **Required Actions** fül → jelöld be újra: "Webauthn Register"

### B) 2FA kikapcsolása egy felhasználónak (vészhelyzet)

1. **Users** → felhasználó
2. **Credentials** fül
3. Töröld az összes WebAuthn/OTP credential-t
4. **Required Actions** fül → vedd ki a 2FA akciókat

### C) Összes session törlése (force logout)

1. **Users** → felhasználó
2. **Sessions** fül
3. **Sign out** vagy **Sign out all sessions**

### D) Realm-wide 2FA kikapcsolása (mindenkinél)

1. **Authentication → Bindings**
2. **Browser Flow** → Válts vissza "browser" (alapértelmezett) flow-ra
3. Vagy módosítsd a flow-t, hogy a 2FA ne legyen REQUIRED

---

## 8. Események és monitoring

### A) Login események megtekintése

1. **Events → Login events**
2. Szűrés:
   - Event type: LOGIN, LOGIN_ERROR, etc.
   - User
   - Client
   - Dátum

### B) Admin események megtekintése

1. **Events → Admin events**
2. Látható:
   - Ki módosította mit
   - User creation/deletion
   - Policy changes

### C) Email értesítések

**Realm Settings → Email:**
- SMTP szerver beállítása
- Test email küldése

**Users → felhasználó → Actions:**
- Send verify email
- Update password email

---

## 9. Realm export/import (Backup)

### A) Realm exportálása

**Parancssoros (Docker konténerben):**
```bash
docker exec -it keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm biometric-2fa \
  --users realm_file
```

### B) Realm importálása

Indításkor automatikus:
```yaml
# docker-compose.yaml
volumes:
  - ./keycloak-backup:/opt/keycloak/data/import
command: start --import-realm
```

### C) Partial import (Admin Console)

1. **Realm Settings → Action → Partial import**
2. JSON fájl feltöltése
3. Választható: Users, Clients, Roles, stb.

---

## 10. Biztonság

### A) Brute Force védelem

**Realm Settings → Security Defenses → Brute Force Detection:**

| Beállítás | Ajánlott | Mit csinál |
|-----------|----------|-----------|
| **Permanent Lockout** | OFF | Végleges tiltás |
| **Max Login Failures** | 5 | Max sikertelen próbálkozás |
| **Wait Increment** | 60 sec | Várakozási idő növelése |
| **Max Wait** | 900 sec (15 perc) | Max várakozási idő |
| **Failure Reset Time** | 12 hours | Számláló reset |

### B) Password Policy

**Authentication → Policies → Password Policy:**

**Add policy:**
- Minimum Length: 8
- Uppercase Characters: 1
- Lowercase Characters: 1
- Digits: 1
- Special Characters: 1
- Not Username
- Not Email

### C) Session timeouts

**Realm Settings → Sessions:**

- **SSO Session Idle**: 30 perc (inaktivitás után logout)
- **SSO Session Max**: 10 óra (max session idő)
- **Client Session Idle**: 30 perc
- **Client Session Max**: 10 óra

---

## Összefoglalás:

✅ **Minden beállítás elérhető GUI-n keresztül**
✅ **Nem kell újraindítás vagy config módosítás**
✅ **Felhasználók önállóan kezelhetik a 2FA eszközeiket**
✅ **Valós idejű módosítások (azonnal érvénybe lépnek)**
✅ **Audit log minden adminisztrációs műveletről**

A Keycloak Admin Console egy komplett enterprise admin felület, minden funkcióval amit egy modern IAM rendszer igényel.
