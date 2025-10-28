# QR kódos telefonos biometrikus 2FA beállítás

## Már elvégzett beállítások:

✅ WebAuthn Policy módosítva **cross-platform** módra (telefonos használathoz)
✅ User Verification **required** (biometrikus kötelező)

## Következő lépések:

### 1. Admin Console-ban ellenőrizd a beállításokat

1. Nyisd meg: **https://localhost:8443/admin**
2. Jelentkezz be: `admin` / `admin123`
3. Válts a **biometric-2fa** realm-re (bal felső sarokban dropdown)

### 2. WebAuthn Policy ellenőrzése

1. Menj: **Authentication → Policies → WebAuthn Policy**
2. Ellenőrizd:
   - **Relying Party Entity Name**: Biometric 2FA Realm
   - **Signature Algorithms**: ES256, RS256
   - **Authenticator Attachment**: **cross-platform** ← FONTOS!
   - **User Verification Requirement**: **required** ← FONTOS!

Ha nem jók az értékek, módosítsd őket:
- **Authenticator Attachment** → válaszd: **cross-platform**
- **User Verification Requirement** → válaszd: **required**
- Kattints **Save**

### 3. Testuser beállítása

1. Menj: **Users** → Keresd: **testuser**
2. **Credentials** fül:
   - Ha van régi WebAuthn credential, **töröld**
3. **Required Actions** fül:
   - Add hozzá: **Webauthn Register**
   - Kattints **Save**

### 4. Telefonos QR kódos 2FA tesztelése

Most készen állsz a tesztelésre!

#### a) Számítógépen:

1. Nyiss **inkognito/private ablakot**
2. Menj: **http://localhost:4200**
3. Kattints **Login**
4. Add meg: `testuser` / `Test123`

#### b) WebAuthn regisztráció jelenik meg:

A Keycloak átirányít egy regisztrációs oldalra.

#### c) QR kód beolvasása telefonon:

**Modern böngészőkben (Chrome, Edge, Safari):**

1. A regisztrációs oldalon kattints **"Register"**
2. Felugró ablak jelenik meg: **"Choose a passkey"**
3. Válaszd: **"Use a phone, tablet or security key"** vagy **"Other device"**
4. **QR kód jelenik meg a képernyőn**

5. **Telefonon:**
   - Nyisd meg a kamerát (iOS) vagy Chrome/Safari böngészőt (Android)
   - **Olvasd be a QR kódot**
   - A telefon megkérdezi: "Save passkey?"
   - **Biometrikus hitelesítés** (ujjlenyomat/Face ID)
   - Megerősítés után a számítógép automatikusan bejelentkeztet

#### d) Következő bejelentkezések:

1. Számítógépen: `testuser` / `Test123`
2. WebAuthn kéri a 2FA-t
3. Kattints **"Use a phone, tablet or security key"**
4. QR kód jelenik meg
5. Telefonon beolvasod + biometrikus hitelesítés
6. Beléptél!

## Támogatott böngészők és platformok:

### Számítógép (QR kód megjelenítés):
- ✅ Chrome 67+ (Windows, macOS, Linux)
- ✅ Edge 18+ (Windows, macOS)
- ✅ Safari 14+ (macOS)
- ✅ Firefox 60+ (részben)

### Telefon (QR kód beolvasás):
- ✅ **iOS 16+** Safari, Chrome (Face ID, Touch ID)
- ✅ **Android 9+** Chrome (ujjlenyomat, arc)

## Ha nem jelenik meg a QR kód:

### Opció 1: Bluetooth párosítás (közelségi módszer)

Ha a telefon és a számítógép közel van egymáshoz:

1. **Bluetooth bekapcsolva** mindkét eszközön
2. A WebAuthn regisztrációnál automatikusan felismeri a telefont
3. Telefonon biometrikus hitelesítés
4. Párosítás nélkül működik (caBLE/Hybrid)

### Opció 2: USB Security Key

Ha nincs támogatott telefon:
- YubiKey vagy más FIDO2 USB kulcs
- Érintsd meg a kulcsot a regisztrációkor

## Hibaelhárítás:

### "This device is not supported"
→ Böngésző nem támogatja a cross-device WebAuthn-t
→ Használj Chrome vagy Edge-t

### "No authenticator found"
→ Bluetooth nincs bekapcsolva
→ Vagy válaszd a QR kódos opciót

### QR kód nem jelenik meg
→ Böngésző nem támogatja
→ Próbáld Chrome-ban vagy Edge-ben

### Telefon nem ismeri fel a QR kódot
→ iOS: Kamera app-ban olvasd be
→ Android: Chrome vagy Safari böngészőben olvasd be
→ Vagy keresd a "Passkeys" beállítást a telefonon

## Tipp: Több eszköz regisztrálása

Bejelentkezés után:
1. Menj: **https://localhost:8443/realms/biometric-2fa/account**
2. **Account Security → Signing In**
3. Kattints **"Add"** a Security Key résznél
4. Regisztrálj további eszközöket (más telefon, tablet, USB key)

Így több eszközzel is be tudsz lépni!

## Videó demó (referencia):

Ha szeretnéd látni működés közben, keress YouTube-on:
"WebAuthn cross-device authentication demo" vagy "FIDO2 passkey with phone"
