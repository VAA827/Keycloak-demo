# 🔐 Let's Encrypt Production Setup - Keycloak

**Utolsó frissítés:** 2025-10-31

Ez a dokumentáció lépésről lépésre végigvezet a **production-ready Keycloak** setup-on **Let's Encrypt ingyenes SSL tanúsítvánnyal**.

---

## 📋 Előfeltételek

### 1. Domain név
- ✅ **Saját domain név** (pl. `keycloak.yourdomain.com`)
- ✅ **DNS A record** beállítva a szerver IP címére
- ✅ Domain propagálva (ellenőrzés: `nslookup keycloak.yourdomain.com`)

### 2. Szerver követelmények
- ✅ **Linux szerver** (Ubuntu 20.04+ / Debian 11+ ajánlott)
- ✅ **Docker & Docker Compose** telepítve
- ✅ **80-as és 443-as port nyitva** (HTTP/HTTPS)
- ✅ **Root vagy sudo hozzáférés**

### 3. Minimális erőforrások
- CPU: 2 core
- RAM: 4 GB
- Disk: 20 GB

---

## 🚀 1. Szerver előkészítése

### 1.1 Csatlakozás SSH-val

```bash
ssh user@your-server-ip
```

### 1.2 Rendszer frissítése

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Docker telepítése (ha még nincs)

```bash
# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose telepítése
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Felhasználó hozzáadása docker csoporthoz
sudo usermod -aG docker $USER

# Újrajelentkezés szükséges
exit
# Jelentkezz be újra SSH-val
```

### 1.4 Firewall beállítása

```bash
# UFW telepítése és engedélyezése
sudo apt install ufw -y

# SSH engedélyezése (fontos, nehogy kizárjon!)
sudo ufw allow 22/tcp

# HTTP és HTTPS engedélyezése (Let's Encrypt-hez kell)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Keycloak port (opcionális, ha közvetlenül eléred)
sudo ufw allow 8443/tcp

# Firewall aktiválása
sudo ufw enable

# Státusz ellenőrzése
sudo ufw status
```

---

## 🔐 2. Let's Encrypt tanúsítvány generálása

### 2.1 Certbot telepítése

```bash
# Certbot és Nginx plugin telepítése
sudo apt install certbot python3-certbot-nginx -y
```

### 2.2 Standalone módban tanúsítvány igénylése

**FONTOS:** Ez a parancs ellenőrzi, hogy a domain valóban rád mutat!

```bash
# Cseréld le a keycloak.yourdomain.com-ot a saját domain nevedre!
sudo certbot certonly --standalone \
  -d keycloak.yourdomain.com \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

**Mit csinál ez?**
- Elindít egy ideiglenes webszervert a 80-as porton
- Let's Encrypt ellenőrzi, hogy a domain rád mutat
- Generál egy **90 napig érvényes** tanúsítványt
- Elmenti: `/etc/letsencrypt/live/keycloak.yourdomain.com/`

**Kimenet (sikeres):**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/keycloak.yourdomain.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/keycloak.yourdomain.com/privkey.pem
```

### 2.3 Tanúsítvány fájlok ellenőrzése

```bash
sudo ls -la /etc/letsencrypt/live/keycloak.yourdomain.com/
```

**Output:**
```
cert.pem       → Keycloak certificate
chain.pem      → Intermediate certificate
fullchain.pem  → cert.pem + chain.pem (ezt használjuk)
privkey.pem    → Private key
```

---

## 🔄 3. PKCS12 konvertálás (Keycloak formátum)

Keycloak **PKCS12 (.p12)** formátumú keystore-t igényel. Konvertáljuk a Let's Encrypt PEM fájlokat:

### 3.1 Projekt könyvtár létrehozása

```bash
# Hozd létre a projekt könyvtárat
mkdir -p /opt/keycloak-app
cd /opt/keycloak-app

# Certs könyvtár
mkdir -p certs
```

### 3.2 PEM → PKCS12 konvertálás

```bash
# Generálj egy erős jelszót (jegyezd meg!)
KEYSTORE_PASSWORD=$(openssl rand -base64 32)
echo "Keystore Password: $KEYSTORE_PASSWORD"
# MENTSD EL EZT A JELSZÓT!!!

# Konvertálás PKCS12-re
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/keycloak.yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/keycloak.yourdomain.com/privkey.pem \
  -out /opt/keycloak-app/certs/keycloak.p12 \
  -name keycloak \
  -passout pass:$KEYSTORE_PASSWORD

# Jogosultságok beállítása
sudo chown $USER:$USER /opt/keycloak-app/certs/keycloak.p12
sudo chmod 600 /opt/keycloak-app/certs/keycloak.p12
```

### 3.3 Ellenőrzés

```bash
# Ellenőrizd a keystore tartalmát
keytool -list -v -keystore /opt/keycloak-app/certs/keycloak.p12 -storepass $KEYSTORE_PASSWORD
```

---

## 📦 4. Projekt fájlok feltöltése

### 4.1 Git clone (ha GitHub-on van)

```bash
cd /opt/keycloak-app
git clone https://github.com/YOUR-USERNAME/keycloak-2fa-biometric.git .
```

### 4.2 Vagy manuális feltöltés (SCP)

```bash
# Helyi gépről (Windows PowerShell / Linux terminal)
scp -r D:\dev\my-keycloak-project/* user@your-server-ip:/opt/keycloak-app/
```

---

## ⚙️ 5. Production környezet beállítása

### 5.1 Environment fájl létrehozása

```bash
cd /opt/keycloak-app

# Másold le a template-et
cp .env.prod.template .env.prod

# Szerkesztd a fájlt
nano .env.prod
```

**Töltsd ki a következőket:**

```bash
# Domain név
KC_HOSTNAME=keycloak.yourdomain.com

# Admin jelszó (generálj erős jelszót!)
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Database jelszó (generálj erős jelszót!)
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE

# Keystore jelszó (amit az előbb generáltál)
KEYSTORE_PASSWORD=YOUR_KEYSTORE_PASSWORD_HERE
```

**Erős jelszavak generálása:**
```bash
# Keycloak admin jelszó
openssl rand -base64 32

# Database jelszó
openssl rand -base64 32
```

**Mentés:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.2 Jogosultságok beállítása

```bash
# Védelem: csak owner olvashatja
chmod 600 .env.prod

# Ellenőrzés
ls -la .env.prod
```

---

## 🐳 6. Docker Compose indítása

### 6.1 Production konfiguráció ellenőrzése

```bash
# Ellenőrizd, hogy a docker-compose.prod.yaml jó-e
cat docker-compose.prod.yaml
```

### 6.2 Indítás production módban

```bash
# Indítás detached módban (háttérben)
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d

# Logok követése
docker-compose -f docker-compose.prod.yaml logs -f
```

**Várd meg ezt az üzenetet:**
```
keycloak-prod | Keycloak 23.0.0 started in Xms
```

### 6.3 Konténerek ellenőrzése

```bash
# Futó konténerek listája
docker ps

# Keycloak health check
curl -k https://localhost:8443/health/ready
```

**Válasz (sikeres):**
```json
{"status": "UP"}
```

---

## 🌐 7. Domain elérés tesztelése

### 7.1 HTTPS kapcsolat teszt

```bash
curl -I https://keycloak.yourdomain.com:8443
```

**Válasz (sikeres):**
```
HTTP/2 200
```

### 7.2 Böngészőben

Nyisd meg a böngészőben:
```
https://keycloak.yourdomain.com:8443/admin
```

**Mit kell látnod:**
- ✅ **Zöld lakat ikon** (biztonságos kapcsolat)
- ✅ **Nincs certificate warning**
- ✅ Keycloak admin bejelentkezési oldal

### 7.3 Bejelentkezés Admin Console-ba

**URL:** `https://keycloak.yourdomain.com:8443/admin`

**Belépés:**
- Username: `admin` (vagy amit .env.prod-ban beállítottál)
- Password: (amit .env.prod-ban beállítottál)

---

## 🔄 8. Automatikus tanúsítvány megújítás

Let's Encrypt tanúsítványok **90 napig érvényesek**. Beállítunk automatikus megújítást.

### 8.1 Certbot auto-renewal teszt

```bash
# Teszteld a renewal folyamatot (dry-run)
sudo certbot renew --dry-run
```

**Válasz (sikeres):**
```
Congratulations, all simulated renewals succeeded
```

### 8.2 Automatikus megújítás beállítása (cron)

```bash
# Cron job létrehozása
sudo crontab -e

# Add hozzá ezt a sort (naponta 2x ellenőriz és szükség esetén megújít)
0 0,12 * * * certbot renew --quiet --deploy-hook "/opt/keycloak-app/scripts/renew-cert.sh"
```

### 8.3 Renewal script létrehozása

```bash
# Scripts könyvtár
mkdir -p /opt/keycloak-app/scripts

# Renewal script
cat > /opt/keycloak-app/scripts/renew-cert.sh << 'EOF'
#!/bin/bash
# Let's Encrypt Renewal Hook - PKCS12 konvertálás és Keycloak restart

DOMAIN="keycloak.yourdomain.com"
KEYSTORE_PASSWORD="YOUR_KEYSTORE_PASSWORD_HERE"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
APP_PATH="/opt/keycloak-app"

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
docker-compose -f docker-compose.prod.yaml --env-file .env.prod restart keycloak

echo "[$(date)] Certificate renewed and Keycloak restarted!"
EOF

# Futtathatóvá tesszük
chmod +x /opt/keycloak-app/scripts/renew-cert.sh

# Szerkeszd és add meg a KEYSTORE_PASSWORD-ot!
nano /opt/keycloak-app/scripts/renew-cert.sh
```

---

## 🔍 9. Monitoring és ellenőrzés

### 9.1 Tanúsítvány lejárati dátum

```bash
# Lejárati dátum ellenőrzése
sudo certbot certificates

# Vagy OpenSSL-lel
echo | openssl s_client -connect keycloak.yourdomain.com:8443 2>/dev/null | openssl x509 -noout -dates
```

### 9.2 Logok ellenőrzése

```bash
# Keycloak logok
docker logs keycloak-prod --tail 100 -f

# PostgreSQL logok
docker logs keycloak-postgres-prod --tail 100 -f

# Összes konténer
docker-compose -f docker-compose.prod.yaml logs -f
```

### 9.3 Health Check

```bash
# Health endpoint
curl -k https://localhost:8443/health/ready

# Metrics (ha engedélyezve)
curl -k https://localhost:8443/metrics
```

---

## 🛡️ 10. Biztonsági ellenőrzés

### 10.1 SSL Labs teszt

Látogass el ide:
```
https://www.ssllabs.com/ssltest/analyze.html?d=keycloak.yourdomain.com&s=YOUR_IP
```

**Cél:** `A` vagy `A+` rating

### 10.2 Port scan ellenőrzés

```bash
# Nyitott portok
sudo netstat -tulpn | grep LISTEN

# Elvárt output:
# 80/tcp   (HTTP - Let's Encrypt challenge)
# 443/tcp  (HTTPS - Nginx reverse proxy)
# 8443/tcp (HTTPS - Keycloak direct)
```

### 10.3 Jelszó erősség ellenőrzés

```bash
# Keycloak admin jelszó
# SOHA NE HASZNÁLJ EGYSZERŰ JELSZÓT PRODUCTION-BEN!
# Példa erős jelszó: aB3$kL9#mP2@qR7!
```

---

## 🚨 Hibaelhárítás

### Problem: "Certificate verification failed"

**Okok:**
1. DNS még nem propagálódott
2. Firewall blokkolja a 80-as portot
3. Domain nem mutat a szerver IP-jére

**Megoldás:**
```bash
# DNS ellenőrzés
nslookup keycloak.yourdomain.com

# Port ellenőrzés
sudo netstat -tulpn | grep :80

# Firewall ellenőrzés
sudo ufw status

# Certbot debug módban
sudo certbot certonly --standalone -d keycloak.yourdomain.com --debug
```

---

### Problem: "PKCS12 password incorrect"

**Megoldás:**
```bash
# Ellenőrizd a .env.prod fájlban a jelszót
cat .env.prod | grep KEYSTORE_PASSWORD

# Generálj új keystore-t helyes jelszóval
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/keycloak.yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/keycloak.yourdomain.com/privkey.pem \
  -out /opt/keycloak-app/certs/keycloak.p12 \
  -name keycloak \
  -passout pass:YOUR_CORRECT_PASSWORD
```

---

### Problem: "Keycloak not starting"

**Megoldás:**
```bash
# Logok ellenőrzése
docker logs keycloak-prod --tail 200

# Konténer restart
docker-compose -f docker-compose.prod.yaml restart keycloak

# Teljes újraindítás
docker-compose -f docker-compose.prod.yaml down
docker-compose -f docker-compose.prod.yaml --env-file .env.prod up -d
```

---

### Problem: "Certificate renewal failed"

**Okok:**
- 80-as port elfoglalt
- Domain már nem mutat a szerverre

**Megoldás:**
```bash
# Állítsd le a Keycloak-ot ideiglenesen
docker-compose -f docker-compose.prod.yaml stop keycloak

# Renewal
sudo certbot renew

# PKCS12 konvertálás
sudo /opt/keycloak-app/scripts/renew-cert.sh

# Keycloak indítása
docker-compose -f docker-compose.prod.yaml start keycloak
```

---

## 📊 Production Checklist

Használd ezt a checklist-et go-live előtt:

- [ ] ✅ Domain név beállítva és propagálva
- [ ] ✅ Let's Encrypt tanúsítvány generálva
- [ ] ✅ PKCS12 keystore létrehozva
- [ ] ✅ `.env.prod` fájl kitöltve **erős jelszavakkal**
- [ ] ✅ Firewall konfigurálva (csak 22, 80, 443 port)
- [ ] ✅ Docker Compose production módban elindul
- [ ] ✅ Keycloak Admin Console elérhető HTTPS-en
- [ ] ✅ **Zöld lakat ikon** a böngészőben
- [ ] ✅ Automatikus cert renewal beállítva (cron)
- [ ] ✅ Backup rendszer működik
- [ ] ✅ Monitoring és alerting beállítva
- [ ] ✅ SSL Labs teszt: A vagy A+ rating
- [ ] ✅ Admin jelszó biztonságos helyen tárolva (password manager)
- [ ] ✅ `.env.prod` és `.env` fájlok **git ignore**-olva

---

## 📚 További információk

**Let's Encrypt dokumentáció:**
- https://letsencrypt.org/getting-started/

**Certbot dokumentáció:**
- https://certbot.eff.org/

**Keycloak TLS dokumentáció:**
- https://www.keycloak.org/server/enabletls

**SSL Best Practices:**
- https://www.ssllabs.com/projects/best-practices/

---

## 🎉 Készen vagy!

Ha minden zöld ✅, akkor:
- 🔐 **Production-ready Keycloak** fut Let's Encrypt tanúsítvánnyal
- 🌐 **HTTPS elérhető** böngészőből (zöld lakat)
- 🔄 **Automatikus cert renewal** 90 naponként
- 🛡️ **Biztonságos** (erős jelszavak, firewall, HTTPS)

**Következő lépések:**
1. [PRODUCTION-SECURITY-CHECKLIST.md](PRODUCTION-SECURITY-CHECKLIST.md) - Teljes biztonsági átvizsgálás
2. [README-BACKUP-RESTORE.md](README-BACKUP-RESTORE.md) - Backup rendszer beállítása
3. Angular app és Spring Boot backend production deployment

---

**Készítette:** Claude Code
**Dátum:** 2025-10-31
**Verzió:** 1.0