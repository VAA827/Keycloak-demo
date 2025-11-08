# ⚡ Quick Start - Keycloak on auth.varganet.cloud

**10 perces gyors telepítés varganet.cloud szerverre**

---

## 📋 Előfeltételek

✅ Domain: **varganet.cloud** (megvan)
✅ Szerver: SSH hozzáférés (megvan)
✅ Választott subdomain: **auth.varganet.cloud**

---

## 🚀 5 lépés a production Keycloak-hoz

### 1️⃣ DNS beállítás (5 perc)

**Domain provider admin felület:**
```
Típus: A Record
Host: auth
Value: [SZERVER_IP_CÍM]
TTL: 3600
```

**Ellenőrzés:**
```bash
nslookup auth.varganet.cloud
# Várj 5-30 percet ha még nem működik
```

---

### 2️⃣ SSH + projekt feltöltés (5 perc)

```bash
# 1. SSH kapcsolat
ssh user@varganet.cloud

# 2. Projekt könyvtár
sudo mkdir -p /opt/keycloak
sudo chown -R $USER:$USER /opt/keycloak
cd /opt/keycloak

# 3. Fájlok feltöltése (másik terminálból, helyi gépről)
# scp -r D:\dev\my-keycloak-project/* user@varganet.cloud:/opt/keycloak/
```

---

### 3️⃣ Let's Encrypt tanúsítvány (10 perc)

```bash
# 1. Certbot telepítés
sudo apt update && sudo apt install certbot -y

# 2. Ha 80-as port foglalt (Snake játék), állítsd le átmenetileg
sudo systemctl stop nginx

# 3. Cert igénylés
sudo certbot certonly --standalone \
  -d auth.varganet.cloud \
  --agree-tos \
  --email YOUR_EMAIL@example.com \
  --non-interactive

# 4. Nginx vissza (ha leállítottad)
sudo systemctl start nginx

# 5. PKCS12 konvertálás
# Generálj keystore jelszót és jegyezd meg!
KEYSTORE_PASSWORD=$(openssl rand -base64 32)
echo "Keystore Password: $KEYSTORE_PASSWORD"
# MENTSD EL!!!

sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem \
  -inkey /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem \
  -out /opt/keycloak/certs/keycloak.p12 \
  -name keycloak \
  -passout pass:$KEYSTORE_PASSWORD

sudo chown $USER:$USER /opt/keycloak/certs/keycloak.p12
sudo chmod 600 /opt/keycloak/certs/keycloak.p12
```

---

### 4️⃣ Environment konfig (5 perc)

```bash
cd /opt/keycloak

# Template másolása
cp .env.varganet.template .env.prod

# Szerkesztés
nano .env.prod
```

**Töltsd ki:**
```bash
KC_HOSTNAME=auth.varganet.cloud

# Generálj 3 erős jelszót (külön terminálban):
# openssl rand -base64 32

KEYCLOAK_ADMIN_PASSWORD=FIRST_GENERATED_PASSWORD
DB_PASSWORD=SECOND_GENERATED_PASSWORD
KEYSTORE_PASSWORD=THE_PASSWORD_FROM_STEP_3
```

**Mentés:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Védelem
chmod 600 .env.prod
```

---

### 5️⃣ Indítás! (2 perc)

```bash
cd /opt/keycloak

# Firewall (ha még nincs)
sudo ufw allow 22,80,443,8443/tcp
sudo ufw --force enable

# Docker indítás
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d

# Logok
docker-compose -f docker-compose.prod.yaml logs -f
# Várd: "Keycloak 23.0.0 started in..."
```

---

## ✅ Tesztelés

### Böngészőben:
```
https://auth.varganet.cloud:8443/admin
```

**Login:**
- Username: `admin`
- Password: (amit .env.prod-ban beállítottál)

**Mit kell látnod:**
- ✅ Zöld lakat ikon
- ✅ Nincs certificate warning
- ✅ Keycloak Admin Console

---

## 🎯 Következő lépések

### Opcionális: Nginx reverse proxy (443-as port)

Ha szeretnéd hogy https://auth.varganet.cloud (443) működjön, nem csak 8443:

```bash
sudo nano /etc/nginx/sites-available/auth.varganet.cloud
```

**Tartalom:**
```nginx
server {
    listen 80;
    server_name auth.varganet.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.varganet.cloud;

    ssl_certificate /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem;

    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Aktiválás:**
```bash
sudo ln -s /etc/nginx/sites-available/auth.varganet.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Most elérhető: **https://auth.varganet.cloud** (443-as port)

---

## 🐍 Snake játék megmarad

```
https://varganet.cloud         → Snake játék (változatlan)
https://auth.varganet.cloud    → Keycloak SSO (új)
```

A Snake játék konfigurációját **NEM** kell módosítani.

---

## 🔄 Automatikus cert renewal

```bash
# Renewal script
cat > /opt/keycloak/scripts/renew-cert.sh << 'EOF'
#!/bin/bash
KEYSTORE_PASSWORD="YOUR_KEYSTORE_PASSWORD"
openssl pkcs12 -export \
  -in /etc/letsencrypt/live/auth.varganet.cloud/fullchain.pem \
  -inkey /etc/letsencrypt/live/auth.varganet.cloud/privkey.pem \
  -out /opt/keycloak/certs/keycloak.p12 \
  -name keycloak \
  -passout pass:$KEYSTORE_PASSWORD
cd /opt/keycloak
docker-compose -f docker-compose.prod.yaml restart keycloak
EOF

chmod +x /opt/keycloak/scripts/renew-cert.sh
nano /opt/keycloak/scripts/renew-cert.sh  # Add meg a jelszót!

# Cron job
sudo crontab -e
# Add hozzá:
# 0 0,12 * * * certbot renew --quiet --deploy-hook "/opt/keycloak/scripts/renew-cert.sh"
```

---

## 🚨 Gyakori problémák

**DNS nem működik:**
```bash
nslookup auth.varganet.cloud
# Várj 30 percet, DNS propagálás időigényes
```

**80-as port foglalt:**
```bash
# Webroot mód használata (nem kell leállítani nginx-et)
sudo certbot certonly --webroot -w /var/www/html -d auth.varganet.cloud
```

**Docker nem elérhető:**
```bash
sudo usermod -aG docker $USER
# Jelentkezz ki és be újra SSH-val
```

---

## 📚 Részletes dokumentáció

- **[DEPLOYMENT-VARGANET-CLOUD.md](DEPLOYMENT-VARGANET-CLOUD.md)** - Teljes deployment guide
- **[LETSENCRYPT-PRODUCTION-SETUP.md](LETSENCRYPT-PRODUCTION-SETUP.md)** - Let's Encrypt részletek
- **[PRODUCTION-SECURITY-CHECKLIST.md](PRODUCTION-SECURITY-CHECKLIST.md)** - Biztonsági checklist

---

## ✅ Checklist

- [ ] DNS A record beállítva (auth → szerver IP)
- [ ] DNS működik (nslookup)
- [ ] Let's Encrypt cert generálva
- [ ] PKCS12 keystore létrehozva
- [ ] .env.prod kitöltve erős jelszavakkal
- [ ] Firewall beállítva
- [ ] Docker elindul
- [ ] HTTPS elérhető
- [ ] Admin bejelentkezés sikeres
- [ ] Snake játék továbbra is működik

---

**Kész! 🎉**

Most már van production-ready Keycloak SSO rendszered:
- 🔐 https://auth.varganet.cloud:8443
- 🔒 Let's Encrypt tanúsítvány
- 🛡️ Biztonságos (HTTPS, erős jelszavak)
- 🔄 Automatikus cert renewal (90 nap)

---

**Készítette:** Claude Code
**Verzió:** 1.0 (varganet.cloud quick start)