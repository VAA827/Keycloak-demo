# 🚀 Keycloak Deployment - varganet.cloud

**Domain:** varganet.cloud
**Keycloak subdomain:** auth.varganet.cloud (vagy másik, amit választasz)
**Dátum:** 2025-10-31

---

## 📋 Jelenlegi helyzet

- ✅ Domain: **varganet.cloud** (működik)
- ✅ Tárhely/szerver elérhető
- ✅ Jelenleg: Snake játék fut a fő domain-en
- ⏳ Keycloak: Telepítendő subdomain-re

---

## 🎯 Cél architektúra

```
varganet.cloud                → Snake játék (meglévő, megmarad)
auth.varganet.cloud           → Keycloak 2FA WebAuthn
api.varganet.cloud (opcionális) → Spring Boot backend
app.varganet.cloud (opcionális) → Angular frontend
```

---

## 🔧 1. lépés: DNS konfiguráció

### Subdomain létrehozása

A domain provider admin felületén (ahol a varganet.cloud-ot regisztráltad):

**A Record hozzáadása:**
```
Típus: A
Host: auth
Value: [A SZERVER IP CÍME]
TTL: 3600 (1 óra)
```

**Ellenőrzés (5-30 perc múlva):**
```bash
nslookup auth.varganet.cloud
# Válasz: A szerver IP címe
```

---

## 🖥️ 2. lépés: Szerver elérés

### SSH kapcsolat
```bash
# Csatlakozz a szerverhez
ssh user@varganet.cloud
# vagy
ssh user@[SZERVER_IP]
```

### Aktuális konfiguráció ellenőrzése
```bash
# Mi fut jelenleg?
docker ps

# Milyen portok vannak használatban?
sudo netstat -tulpn | grep LISTEN

# Snake játék hol fut?
# Nginx config ellenőrzés
sudo cat /etc/nginx/sites-enabled/default
```

---

## 🐳 3. lépés: Keycloak telepítés

### 3.1 Projekt könyvtár létrehozása
```bash
# Hozd létre a Keycloak projekt könyvtárat
sudo mkdir -p /opt/keycloak
cd /opt/keycloak

# Jogosultságok
sudo chown -R $USER:$USER /opt/keycloak
```

### 3.2 Projekt fájlok feltöltése

**Opció A: Git clone (ha GitHub-on van)**
```bash
cd /opt/keycloak
git clone https://github.com/YOUR-USERNAME/keycloak-2fa-biometric.git .
```

**Opció B: SCP feltöltés helyi gépről**
```bash
# Helyi gépen (Windows PowerShell / Linux terminal)
scp -r D:\dev\my-keycloak-project/* user@varganet.cloud:/opt/keycloak/
```

---

## 🔐 4. lépés: Let's Encrypt tanúsítvány

### 4.1 Certbot telepítése
```bash
sudo apt update
sudo apt install certbot -y
```

### 4.2 Tanúsítvány igénylése auth.varganet.cloud-ra

**FONTOS:** Ha a 80-as port már foglalt (Snake játék), átmenetileg állítsd le:
```bash
# Ellenőrizd mi fut a 80-as porton
sudo netstat -tulpn | grep :80

# Ha Nginx fut, állítsd le átmenetileg
sudo systemctl stop nginx
```

**Cert igénylése:**
```bash
sudo certbot certonly --standalone \
  -d auth.varganet.cloud \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

**Sikeres kimenet:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem
```

**Nginx visszaindítása (ha leállítottad):**
```bash
sudo systemctl start nginx
```

### 4.3 PKCS12 konvertálás
```bash
# Erős jelszó generálása
KEYSTORE_PASSWORD=$(openssl rand -base64 32)
echo "Keystore Password: $KEYSTORE_PASSWORD"
# MENTSD EL EZT A JELSZÓT!!!

# PKCS12 konvertálás
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem \
  -inkey /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem \
  -out /opt/keycloak/certs/keycloak.p12 \
  -name keycloak \
  -passout pass:$KEYSTORE_PASSWORD

# Jogosultságok
sudo chown $USER:$USER /opt/keycloak/certs/keycloak.p12
sudo chmod 600 /opt/keycloak/certs/keycloak.p12
```

---

## ⚙️ 5. lépés: Environment konfiguráció

### 5.1 .env.prod fájl létrehozása
```bash
cd /opt/keycloak

# Template másolása
cp .env.prod.template .env.prod

# Szerkesztés
nano .env.prod
```

### 5.2 .env.prod tartalma (auth.varganet.cloud-hoz)
```bash
# ============================================
# DOMAIN & HOSTNAME
# ============================================
KC_HOSTNAME=auth.varganet.cloud

# ============================================
# KEYCLOAK ADMIN
# ============================================
KEYCLOAK_ADMIN=admin
# Generálj erős jelszót: openssl rand -base64 32
KEYCLOAK_ADMIN_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

# ============================================
# DATABASE
# ============================================
# Generálj erős jelszót: openssl rand -base64 32
DB_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

# ============================================
# SSL CERTIFICATE
# ============================================
# A keystore jelszó amit az előbb generáltál
KEYSTORE_PASSWORD=YOUR_GENERATED_KEYSTORE_PASSWORD

# ============================================
# PRODUCTION SETTINGS
# ============================================
KC_LOG_LEVEL=WARN
KC_PROXY=edge
```

**Jelszavak generálása:**
```bash
# Admin jelszó
openssl rand -base64 32

# Database jelszó
openssl rand -base64 32
```

**Mentés:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Védelem:**
```bash
chmod 600 .env.prod
```

---

## 🔥 6. lépés: Firewall beállítás

```bash
# UFW telepítése (ha nincs)
sudo apt install ufw -y

# SSH engedélyezése (FONTOS! Nehogy kizárjon!)
sudo ufw allow 22/tcp

# HTTP és HTTPS (Let's Encrypt és web traffic)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Keycloak port (csak ha közvetlenül eléred)
sudo ufw allow 8443/tcp

# Firewall aktiválása
sudo ufw enable

# Státusz
sudo ufw status verbose
```

---

## 🚀 7. lépés: Keycloak indítás

### 7.1 Docker ellenőrzés
```bash
# Docker verzió
docker --version

# Docker Compose verzió
docker-compose --version

# Ha nincs Docker, telepítsd:
# curl -fsSL https://get.docker.com -o get-docker.sh
# sudo sh get-docker.sh
```

### 7.2 Production indítás
```bash
cd /opt/keycloak

# Indítás production módban
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d

# Logok követése
docker-compose -f docker-compose.prod.yaml logs -f keycloak
```

**Várd meg ezt az üzenetet:**
```
keycloak-prod | Keycloak 23.0.0 started in Xms
```

### 7.3 Health check
```bash
# Helyi elérés
curl -k https://localhost:8443/health/ready

# Publikus elérés
curl https://auth.varganet.cloud:8443/health/ready
```

**Válasz (sikeres):**
```json
{"status": "UP"}
```

---

## 🌐 8. lépés: Nginx reverse proxy (opcionális, de ajánlott)

Ha szeretnéd, hogy a Keycloak a **443-as porton** legyen elérhető (standard HTTPS), nem pedig 8443-on:

### 8.1 Nginx config létrehozása
```bash
sudo nano /etc/nginx/sites-available/auth.varganet.cloud
```

**Tartalom:**
```nginx
# Keycloak reverse proxy - auth.varganet.cloud

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name auth.varganet.cloud;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Minden más → HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name auth.varganet.cloud;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Keycloak (8443)
    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logging
    access_log /var/log/nginx/auth.varganet.cloud.access.log;
    error_log /var/log/nginx/auth.varganet.cloud.error.log;
}
```

### 8.2 Nginx config aktiválása
```bash
# Symlink létrehozása
sudo ln -s /etc/nginx/sites-available/auth.varganet.cloud /etc/nginx/sites-enabled/

# Config teszt
sudo nginx -t

# Nginx reload
sudo systemctl reload nginx
```

### 8.3 Keycloak proxy beállítás frissítése
```bash
# .env.prod szerkesztése
nano /opt/keycloak/.env.prod

# Ellenőrizd hogy ez benne van:
KC_PROXY=edge
KC_HOSTNAME_STRICT_HTTPS=true
```

```bash
# Keycloak restart
cd /opt/keycloak
docker-compose -f docker-compose.prod.yaml restart keycloak
```

**Ezután elérhető lesz:**
- ✅ https://auth.varganet.cloud/admin (443-as port, Nginx proxy)
- ✅ https://auth.varganet.cloud:8443/admin (közvetlen 8443-on is)

---

## ✅ 9. lépés: Tesztelés

### 9.1 Böngészőben
Nyisd meg:
```
https://auth.varganet.cloud/admin
```

**Mit kell látnod:**
- ✅ **Zöld lakat ikon** (biztonságos kapcsolat)
- ✅ **Nincs certificate warning**
- ✅ Keycloak admin bejelentkezési oldal

### 9.2 Bejelentkezés
- **Username:** `admin` (vagy amit .env.prod-ban beállítottál)
- **Password:** (amit .env.prod-ban beállítottál)

### 9.3 SSL teszt
```bash
# SSL Labs teszt (10-15 perc)
# https://www.ssllabs.com/ssltest/analyze.html?d=auth.varganet.cloud

# Gyors teszt
curl -I https://auth.varganet.cloud
```

---

## 🔄 10. lépés: Automatikus cert renewal

### 10.1 Renewal script
```bash
mkdir -p /opt/keycloak/scripts

cat > /opt/keycloak/scripts/renew-cert.sh << 'EOF'
#!/bin/bash
# Let's Encrypt Renewal Hook - auth.varganet.cloud

DOMAIN="auth.varganet.cloud"
KEYSTORE_PASSWORD="YOUR_KEYSTORE_PASSWORD_HERE"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
APP_PATH="/opt/keycloak"

echo "[$(date)] Starting certificate renewal..."

# PKCS12 konvertálás
openssl pkcs12 -export \
  -in "$CERT_PATH/fullchain.pem" \
  -inkey "$CERT_PATH/privkey.pem" \
  -out "$APP_PATH/certs/keycloak.p12" \
  -name keycloak \
  -passout pass:$KEYSTORE_PASSWORD

# Jogosultságok
chown $USER:$USER "$APP_PATH/certs/keycloak.p12"
chmod 600 "$APP_PATH/certs/keycloak.p12"

# Keycloak restart
cd "$APP_PATH"
docker-compose -f docker-compose.prod.yaml restart keycloak

# Nginx reload (ha van reverse proxy)
systemctl reload nginx

echo "[$(date)] Certificate renewed and services restarted!"
EOF

chmod +x /opt/keycloak/scripts/renew-cert.sh

# Szerkeszd és add meg a KEYSTORE_PASSWORD-ot!
nano /opt/keycloak/scripts/renew-cert.sh
```

### 10.2 Cron job
```bash
sudo crontab -e

# Add hozzá ezt a sort (naponta 2x ellenőriz)
0 0,12 * * * certbot renew --quiet --deploy-hook "/opt/keycloak/scripts/renew-cert.sh"
```

---

## 📊 11. Snake játék megtartása

A Snake játék **megmarad** a fő domain-en (varganet.cloud), mert a Keycloak külön subdomain-en fut.

**Architektúra:**
```
https://varganet.cloud         → Snake játék (változatlan)
https://auth.varganet.cloud    → Keycloak SSO
```

**Nginx config ellenőrzés:**
```bash
# Meglévő Snake játék config
sudo cat /etc/nginx/sites-enabled/default
# vagy
sudo cat /etc/nginx/sites-enabled/varganet.cloud
```

A Snake játék config-ját **NEM kell módosítani**, teljesen függetlenek egymástól.

---

## 🎯 12. Angular & Spring Boot integráció

Ha szeretnéd az Angular app-ot és Spring Boot backend-et is telepíteni:

### Angular app (app.varganet.cloud)
```bash
# Nginx config
sudo nano /etc/nginx/sites-available/app.varganet.cloud

# Build Angular production
cd /opt/keycloak/angular-app
npm run build --configuration production

# Nginx-ben static hosting
# root /opt/keycloak/angular-app/dist/angular-app/browser;
```

### Spring Boot backend (api.varganet.cloud)
```bash
# Docker vagy systemd service
cd /opt/keycloak/backend/keycloak-demo
./mvnw clean package
java -jar target/keycloak-demo.jar --spring.profiles.active=prod
```

**Environment frissítés:**
```typescript
// angular-app/src/environments/environment.prod.ts
export const environment = {
  production: true,
  keycloak: {
    url: 'https://auth.varganet.cloud',
    realm: 'biometric-2fa',
    clientId: 'angular-app'
  },
  apiUrl: 'https://api.varganet.cloud'
};
```

---

## 🚨 Hibaelhárítás

### Problem: "DNS not resolving"
```bash
# Várd meg a DNS propagálást (5-30 perc)
nslookup auth.varganet.cloud

# Ha nem működik, ellenőrizd a domain provider DNS beállításokat
```

### Problem: "Port 80 already in use"
```bash
# Ellenőrizd mi fut a 80-as porton
sudo netstat -tulpn | grep :80

# Ha Nginx fut és nem akarod leállítani, használd a webroot módot:
sudo certbot certonly --webroot -w /var/www/html -d auth.varganet.cloud
```

### Problem: "Certificate verification failed"
```bash
# Ellenőrizd a DNS A record-ot
nslookup auth.varganet.cloud

# Firewall ellenőrzés
sudo ufw status

# Certbot debug
sudo certbot certonly --standalone -d auth.varganet.cloud --debug
```

---

## ✅ Deployment Checklist

- [ ] ✅ Subdomain választva (pl. auth.varganet.cloud)
- [ ] ✅ DNS A record beállítva
- [ ] ✅ DNS propagálva (nslookup működik)
- [ ] ✅ SSH hozzáférés a szerverhez
- [ ] ✅ Docker telepítve
- [ ] ✅ Firewall konfigurálva
- [ ] ✅ Let's Encrypt cert generálva
- [ ] ✅ PKCS12 keystore létrehozva
- [ ] ✅ .env.prod kitöltve erős jelszavakkal
- [ ] ✅ Keycloak elindul
- [ ] ✅ Health check sikeres
- [ ] ✅ HTTPS elérhető böngészőből
- [ ] ✅ Admin bejelentkezés működik
- [ ] ✅ Zöld lakat ikon látható
- [ ] ✅ Automatikus renewal beállítva
- [ ] ✅ Snake játék továbbra is működik

---

## 🎉 Kész!

Ha minden zöld ✅, akkor:
- 🔐 **Production Keycloak** fut: https://auth.varganet.cloud
- 🐍 **Snake játék** megmaradt: https://varganet.cloud
- 🔒 **Let's Encrypt cert** érvényes 90 napig (auto-renewal)
- 🛡️ **Biztonságos** (HTTPS, erős jelszavak, firewall)

---

## 📞 Következő lépések

1. **Angular app deployment** → app.varganet.cloud
2. **Spring Boot backend** → api.varganet.cloud
3. **Monitoring beállítás** → Prometheus + Grafana
4. **Backup automatizálás** → napi PostgreSQL dump
5. **2FA tesztelés** → WebAuthn QR code

---

**Készítette:** Claude Code
**Dátum:** 2025-10-31
**Verzió:** 1.0 (varganet.cloud specifikus)