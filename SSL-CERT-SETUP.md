# 🔐 SSL Certificate Setup - Keycloak

## 📋 Jelenlegi Helyzet

A projekt **saját SSL tanúsítványt** használ a `certs/` könyvtárban:

```
certs/
└── keycloak.p12  (PKCS12 keystore, jelszó: test)
```

**Docker Compose mount:**
```yaml
volumes:
  - ./certs/keycloak.p12:/opt/keycloak/conf/keycloak.p12:ro
```

---

## 🎯 Opciók

### 1️⃣ Meglévő Cert Használata (Jelenlegi Állapot) ✅

**Mit csinál:**
- A `certs/keycloak.p12` fájlt használja
- Self-signed certificate
- Localhost domain
- Jelszó: `test`

**Használat:**
```bash
docker-compose up -d
# Elérhető: https://localhost:8443
```

**Böngészőben:**
- Chrome/Edge: "Your connection is not private" → Advanced → Proceed to localhost
- Firefox: "Warning: Potential Security Risk" → Advanced → Accept the Risk

---

### 2️⃣ Új Self-Signed Cert Generálása (Development)

Ha új cert-et szeretnél generálni (pl. más domain, új jelszó):

#### A) mkcert használata (Ajánlott - trusted cert)

**Telepítés:**
```bash
# Windows (Chocolatey)
choco install mkcert

# macOS (Homebrew)
brew install mkcert

# Linux
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

**Root CA telepítése (csak egyszer):**
```bash
mkcert -install
```

**Keycloak cert generálása:**
```bash
# PKCS12 keystore generálása localhost domain-nel
mkcert -pkcs12 -p12-file certs/keycloak.p12 localhost 127.0.0.1 ::1

# Ha jelszót szeretnél (alapból üres):
# Windows PowerShell:
$password = ConvertTo-SecureString -String "test" -Force -AsPlainText
mkcert -pkcs12 -p12-file certs/keycloak.p12 localhost

# Jelszó beállítása külön (keytool):
keytool -importkeystore \
  -srckeystore certs/keycloak.p12 -srcstoretype PKCS12 -srcstorepass "" \
  -destkeystore certs/keycloak.p12 -deststoretype PKCS12 -deststorepass test
```

**Előny:**
- ✅ Böngésző trusted (nincs warning)
- ✅ Local development barátságos
- ✅ Gyors setup

---

#### B) OpenSSL használata (Manual)

**1. Private key generálása:**
```bash
openssl genrsa -out certs/keycloak-key.pem 2048
```

**2. Certificate Signing Request (CSR):**
```bash
openssl req -new -key certs/keycloak-key.pem -out certs/keycloak.csr \
  -subj "/C=HU/ST=Budapest/L=Budapest/O=MyCompany/CN=localhost"
```

**3. Self-signed certificate:**
```bash
openssl x509 -req -days 365 \
  -in certs/keycloak.csr \
  -signkey certs/keycloak-key.pem \
  -out certs/keycloak.crt
```

**4. PKCS12 keystore létrehozása:**
```bash
openssl pkcs12 -export \
  -in certs/keycloak.crt \
  -inkey certs/keycloak-key.pem \
  -out certs/keycloak.p12 \
  -name keycloak \
  -passout pass:test
```

**5. Ellenőrzés:**
```bash
keytool -list -v -keystore certs/keycloak.p12 -storepass test
```

---

#### C) Java Keytool használata

**1. Keystore és self-signed cert generálása:**
```bash
keytool -genkeypair \
  -alias keycloak \
  -keyalg RSA \
  -keysize 2048 \
  -validity 365 \
  -keystore certs/keycloak.p12 \
  -storetype PKCS12 \
  -storepass test \
  -keypass test \
  -dname "CN=localhost, OU=Development, O=MyCompany, L=Budapest, ST=Budapest, C=HU" \
  -ext "SAN=dns:localhost,ip:127.0.0.1"
```

**2. Ellenőrzés:**
```bash
keytool -list -v -keystore certs/keycloak.p12 -storepass test
```

**Előny:**
- ✅ Nincs külső tool szükséges (Java keytool)
- ✅ Egy parancs
- ✅ Subject Alternative Name (SAN) támogatás

---

### 3️⃣ Production Cert (Let's Encrypt vagy CA-signed)

#### A) Let's Encrypt (Ingyen, automatikus renewal)

**Certbot használata:**
```bash
# Telepítés
sudo apt-get install certbot  # Linux
brew install certbot          # macOS

# Cert generálása (HTTP challenge)
sudo certbot certonly --standalone -d yourdomain.com
```

**Cert konvertálása PKCS12-re:**
```bash
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/yourdomain.com/privkey.pem \
  -out certs/keycloak.p12 \
  -name keycloak \
  -passout pass:your-secure-password
```

**Docker Compose frissítése:**
```yaml
command:
  - start
  - --https-key-store-file=/opt/keycloak/conf/keycloak.p12
  - --https-key-store-password=your-secure-password
  - --features=preview
  - --import-realm
```

**Automatikus renewal (cron):**
```bash
# /etc/cron.daily/certbot-renew
#!/bin/bash
certbot renew --quiet
# Convert to PKCS12 after renewal
# Restart Keycloak
docker-compose restart keycloak
```

---

#### B) Commercial CA (DigiCert, Comodo, stb.)

**1. CSR generálása:**
```bash
keytool -certreq \
  -alias keycloak \
  -keystore certs/keycloak.p12 \
  -file certs/keycloak.csr \
  -storepass your-password
```

**2. CSR beküldése CA-nak**
- DigiCert, Comodo, GlobalSign, stb. weboldalán
- Certificate visszakapása

**3. Certificate import:**
```bash
# Root CA cert import (ha szükséges)
keytool -import \
  -trustcacerts \
  -alias root \
  -file root-ca.crt \
  -keystore certs/keycloak.p12 \
  -storepass your-password

# Intermediate CA cert import (ha szükséges)
keytool -import \
  -trustcacerts \
  -alias intermediate \
  -file intermediate-ca.crt \
  -keystore certs/keycloak.p12 \
  -storepass your-password

# Saját certificate import
keytool -import \
  -trustcacerts \
  -alias keycloak \
  -file yourdomain.com.crt \
  -keystore certs/keycloak.p12 \
  -storepass your-password
```

---

## 🔧 Cert Jelszó Megváltoztatása

Ha szeretnéd megváltoztatni a keystore jelszavát:

```bash
# Jelenlegi: test → Új: new-password

keytool -storepasswd \
  -keystore certs/keycloak.p12 \
  -storepass test \
  -new new-password

# Frissítsd a docker-compose.yaml-t:
command:
  - --https-key-store-password=new-password
```

---

## 🛡️ Biztonsági Best Practices

### Development:

1. **Self-signed cert OK**
   - Használj mkcert-et (trusted local cert)
   - Vagy OpenSSL self-signed

2. **Ne commitold a private key-t**
   ```gitignore
   # .gitignore
   certs/*.pem
   certs/*.key
   certs/*.csr
   certs/*.p12
   !certs/README.md
   ```

3. **Egyszerű jelszó OK development-ben**
   - `test`, `password`, `changeit`

---

### Production:

1. **Használj Let's Encrypt vagy CA-signed cert**
   - ✅ Ingyen (Let's Encrypt)
   - ✅ Automatikus renewal
   - ✅ Trusted minden böngészőben

2. **Erős jelszó**
   ```bash
   openssl rand -base64 32
   # Eredmény: XyZ123...erős-jelszó
   ```

3. **Secrets kezelés**
   - Docker secrets
   - Kubernetes secrets
   - HashiCorp Vault
   - Azure Key Vault / AWS Secrets Manager

4. **Cert renewal automatizálás**
   - Cron job
   - CI/CD pipeline
   - Let's Encrypt certbot auto-renewal

5. **Monitoring**
   - Cert expiry date ellenőrzés
   - Alert 30 nappal lejárat előtt

---

## 📂 Cert Fájlok Struktúrája

```
certs/
├── keycloak.p12           # PKCS12 keystore (ez kell a Keycloak-nak)
├── keycloak-key.pem       # Private key (NE COMMITOLD!)
├── keycloak.crt           # Certificate (public)
├── keycloak.csr           # Certificate Signing Request
└── README.md              # Ez a dokumentáció
```

**Docker csak ezt használja:**
- `keycloak.p12` - PKCS12 keystore

---

## 🧪 Cert Tesztelése

### 1. Keycloak indítása
```bash
docker-compose up -d
docker logs keycloak --follow
# Várd meg: "Keycloak started in..."
```

### 2. HTTPS kapcsolat teszt
```bash
curl -k https://localhost:8443
# Válasz: HTML (Keycloak kezdőoldal)
```

### 3. Cert részletek lekérése
```bash
# OpenSSL
echo | openssl s_client -connect localhost:8443 -servername localhost 2>/dev/null | openssl x509 -noout -text

# Keytool
keytool -list -v -keystore certs/keycloak.p12 -storepass test
```

### 4. Expiry date ellenőrzése
```bash
keytool -list -v -keystore certs/keycloak.p12 -storepass test | grep "Valid from"

# Vagy OpenSSL:
openssl pkcs12 -in certs/keycloak.p12 -passin pass:test -nokeys | openssl x509 -noout -dates
```

---

## ⚠️ Gyakori Problémák

### Problem: "PKCS12 password incorrect"

**Megoldás:**
```bash
# Ellenőrizd a jelszót
keytool -list -keystore certs/keycloak.p12 -storepass test

# Ha nem működik, generálj új cert-et
```

---

### Problem: "Certificate expired"

**Megoldás:**
```bash
# Ellenőrizd a lejárati dátumot
keytool -list -v -keystore certs/keycloak.p12 -storepass test | grep Valid

# Ha lejárt, generálj újat
rm certs/keycloak.p12
mkcert -pkcs12 -p12-file certs/keycloak.p12 localhost

# Vagy OpenSSL-lel (365 nap):
openssl pkcs12 -export -out certs/keycloak.p12 ...
```

---

### Problem: "Browser warning: NET::ERR_CERT_AUTHORITY_INVALID"

**OK:** Self-signed certificate

**Megoldás (Development):**
1. **Használj mkcert-et** (automatikusan trusted lesz)
   ```bash
   mkcert -install
   mkcert -pkcs12 -p12-file certs/keycloak.p12 localhost
   ```

2. **Vagy fogadd el a warning-ot:**
   - Chrome/Edge: Advanced → Proceed to localhost
   - Firefox: Advanced → Accept the Risk

**Megoldás (Production):**
- Használj Let's Encrypt vagy CA-signed cert-et

---

### Problem: "HTTPS not working after cert change"

**Megoldás:**
```bash
# 1. Ellenőrizd a fájl jogosultságokat
ls -la certs/keycloak.p12

# 2. Ellenőrizd a docker-compose mount-ot
docker inspect keycloak | grep keycloak.p12

# 3. Restart Keycloak
docker-compose restart keycloak

# 4. Nézd a logokat
docker logs keycloak --tail 50
```

---

## 🔄 Cert Update Folyamat

### Development:
```bash
# 1. Új cert generálása
mkcert -pkcs12 -p12-file certs/keycloak-new.p12 localhost

# 2. Backup régi cert
mv certs/keycloak.p12 certs/keycloak-old.p12

# 3. Új cert használata
mv certs/keycloak-new.p12 certs/keycloak.p12

# 4. Restart
docker-compose restart keycloak
```

### Production:
```bash
# 1. Let's Encrypt renewal
certbot renew

# 2. Konvertálás PKCS12-re
openssl pkcs12 -export ...

# 3. Backup
cp certs/keycloak.p12 certs/keycloak-backup-$(date +%Y%m%d).p12

# 4. Replace cert
cp /path/to/new-cert.p12 certs/keycloak.p12

# 5. Rolling restart (zero downtime)
docker-compose up -d --no-deps --build keycloak
```

---

## 📞 További Információk

**Keycloak SSL dokumentáció:**
- https://www.keycloak.org/server/enabletls

**Let's Encrypt:**
- https://letsencrypt.org/getting-started/

**mkcert:**
- https://github.com/FiloSottile/mkcert

**OpenSSL:**
- https://www.openssl.org/docs/

---

**Utolsó frissítés:** 2025-10-28
