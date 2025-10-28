# SSL Certificates Directory

## 📁 Fájlok

Ebben a könyvtárban van a Keycloak SSL tanúsítvány:

```
certs/
├── keycloak.p12         # PKCS12 keystore (jelenleg használt)
└── README.md            # Ez a fájl
```

## 🔐 Jelenlegi Konfiguráció

**Fájl:** `keycloak.p12`
**Típus:** PKCS12 keystore
**Jelszó:** `test`
**Domain:** localhost
**Típus:** Self-signed certificate
**Érvényesség:** 365 nap (generálás dátumától)

## 🔗 Docker Mount

A Docker Compose így csatolja:

```yaml
volumes:
  - ./certs/keycloak.p12:/opt/keycloak/conf/keycloak.p12:ro
```

## 📖 Dokumentáció

**Teljes SSL setup útmutató:**
- `../SSL-CERT-SETUP.md`

**Hogyan generálj új cert-et:**
- mkcert (ajánlott): `SSL-CERT-SETUP.md` → "Új Self-Signed Cert Generálása"
- OpenSSL: `SSL-CERT-SETUP.md` → "OpenSSL használata"
- Keytool: `SSL-CERT-SETUP.md` → "Java Keytool használata"

## ⚠️ Biztonsági Figyelmeztetés

**NE COMMITOLD GIT-BE:**
- ❌ `*.p12` fájlokat
- ❌ `*.pem` (private key) fájlokat
- ❌ `*.key` fájlokat

**A `.gitignore` védelem:**
```gitignore
certs/*.p12
certs/*.pem
certs/*.key
!certs/README.md
```

## 🔄 Cert Csere

Ha új cert-et generálsz:

```bash
# 1. Backup régi cert
mv certs/keycloak.p12 certs/keycloak-old.p12

# 2. Új cert áthelyezése ide
cp /path/to/new-cert.p12 certs/keycloak.p12

# 3. Restart Keycloak
docker-compose restart keycloak
```

## 🧪 Cert Tesztelés

```bash
# Keystore tartalmának ellenőrzése
keytool -list -v -keystore certs/keycloak.p12 -storepass test

# HTTPS kapcsolat teszt
curl -k https://localhost:8443

# Lejárati dátum ellenőrzése
keytool -list -v -keystore certs/keycloak.p12 -storepass test | grep Valid
```

## 📞 Szükséged van segítségre?

Nézd meg: `../SSL-CERT-SETUP.md`
