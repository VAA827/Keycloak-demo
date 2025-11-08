# 🛡️ Production Security Checklist - Keycloak

**Utolsó frissítés:** 2025-10-31

Használd ezt a checklist-et **production deployment előtt** és **rendszeres biztonsági audit**-hoz.

---

## 📋 1. SSL/TLS Tanúsítvány

### Tanúsítvány
- [ ] ✅ **Let's Encrypt vagy CA-signed tanúsítvány** használata (NEM self-signed!)
- [ ] ✅ Tanúsítvány érvényessége **legalább 30 nap**
- [ ] ✅ **Wildcard cert** (ha több subdomain)
- [ ] ✅ Tanúsítvány chain teljes (fullchain.pem)
- [ ] ✅ Private key biztonságos (600 jogosultság)

### Automatikus megújítás
- [ ] ✅ Certbot auto-renewal beállítva (cron job)
- [ ] ✅ Renewal script működik (dry-run teszt)
- [ ] ✅ Alert beállítva 30 nappal lejárat előtt
- [ ] ✅ Backup tanúsítvány meglétése

### SSL konfiguráció
- [ ] ✅ TLS 1.2+ minimum (TLS 1.0/1.1 tiltva)
- [ ] ✅ Erős cipher suite-ok használata
- [ ] ✅ HSTS header beállítva
- [ ] ✅ SSL Labs teszt: **A vagy A+ rating**

**Ellenőrzés:**
```bash
# Lejárati dátum
sudo certbot certificates

# SSL Labs teszt
# https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Cipher suite-ok
nmap --script ssl-enum-ciphers -p 8443 keycloak.yourdomain.com
```

---

## 🔐 2. Jelszavak és hitelesítési adatok

### Keycloak Admin
- [ ] ✅ **Admin jelszó megváltoztatva** (NEM: admin123!)
- [ ] ✅ Admin jelszó **minimum 20 karakter**
- [ ] ✅ Speciális karakterek, számok, kis/nagy betűk
- [ ] ✅ Admin jelszó **password manager**-ben tárolva
- [ ] ✅ Admin felhasználónév is megváltoztatva (NEM: admin)
- [ ] ✅ 2FA/MFA engedélyezve admin account-ra

### Database jelszó
- [ ] ✅ **PostgreSQL jelszó megváltoztatva** (NEM: keycloak_password!)
- [ ] ✅ DB jelszó **minimum 32 karakter** (használj `openssl rand -base64 32`)
- [ ] ✅ DB jelszó **soha nem commitolva** git-be

### Keystore jelszó
- [ ] ✅ **Keystore jelszó erős** (NEM: test!)
- [ ] ✅ Minimum 20 karakter
- [ ] ✅ Biztonságos helyen tárolva

### Environment változók
- [ ] ✅ `.env.prod` fájl **600 jogosultság** (`chmod 600 .env.prod`)
- [ ] ✅ `.env.prod` fájl **git ignore**-olva
- [ ] ✅ Éles jelszavak **SOHA NEM** kerülnek Git-be

**Jelszó generálás:**
```bash
# Erős jelszó generálása
openssl rand -base64 32

# Vagy speciális karakterekkel
openssl rand -base64 24 | tr '+/' '-_'
```

---

## 🔥 3. Firewall és hálózat

### Firewall szabályok
- [ ] ✅ **UFW vagy iptables** engedélyezve
- [ ] ✅ Csak szükséges portok nyitva:
  - 22/tcp (SSH - csak megbízható IP-kről!)
  - 80/tcp (HTTP - csak Let's Encrypt challenge-hez)
  - 443/tcp (HTTPS - Nginx reverse proxy)
  - 8443/tcp (opcionális - csak ha közvetlenül eléred)
- [ ] ✅ **5432/tcp (PostgreSQL) ZÁRVA** kívülről
- [ ] ✅ SSH kulcs alapú authentikáció (jelszó tiltva)

**Ellenőrzés:**
```bash
# Firewall státusz
sudo ufw status verbose

# Nyitott portok
sudo netstat -tulpn | grep LISTEN

# Port scan (külső teszt)
nmap -Pn -p 1-10000 yourdomain.com
```

### Hálózati izolálás
- [ ] ✅ Docker network használata (nem host mode)
- [ ] ✅ PostgreSQL **NEM** érhető el kívülről
- [ ] ✅ Konténerek között csak szükséges kommunikáció

---

## 🐳 4. Docker biztonsági beállítások

### Konténer hardening
- [ ] ✅ **Non-root user** használata konténerekben
- [ ] ✅ `security-opt: no-new-privileges:true`
- [ ] ✅ Read-only file system ahol lehetséges
- [ ] ✅ Resource limits beállítva (CPU, RAM)
- [ ] ✅ Health check-ek működnek

### Image security
- [ ] ✅ **Hivatalos image**-ek használata (quay.io/keycloak, postgres:15)
- [ ] ✅ Image vulnerability scan (Trivy, Clair)
- [ ] ✅ Image tag fix verzió (NEM: latest)
- [ ] ✅ Image checksum verification

**Ellenőrzés:**
```bash
# Vulnerability scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image quay.io/keycloak/keycloak:23.0.0

# Konténer resource usage
docker stats
```

### Volume jogosultságok
- [ ] ✅ Cert fájlok **read-only** mountolva (`:ro`)
- [ ] ✅ Volume-ok jogosultsága megfelelő (600 vagy 644)
- [ ] ✅ Sensitive fájlok NEM world-readable

---

## 🔧 5. Keycloak konfiguráció

### Hostname és domain
- [ ] ✅ `KC_HOSTNAME` beállítva **publikus domain névre**
- [ ] ✅ `KC_HOSTNAME_STRICT=true`
- [ ] ✅ `KC_HOSTNAME_STRICT_HTTPS=true`
- [ ] ✅ `KC_HTTP_ENABLED=false` (csak HTTPS!)

### Admin konzol védelem
- [ ] ✅ Admin konzol **NEM publikus** (VPN vagy IP whitelist)
- [ ] ✅ Admin account 2FA engedélyezve
- [ ] ✅ Admin session timeout beállítva (15 perc)
- [ ] ✅ Brute-force protection engedélyezve

### Realm beállítások
- [ ] ✅ Email verifikáció **kötelező** új felhasználóknak
- [ ] ✅ Password policy szigorú:
  - Minimum 12 karakter
  - Nagy/kis betű kötelező
  - Szám kötelező
  - Speciális karakter kötelező
  - Password history (utolsó 5 jelszó nem használható)
- [ ] ✅ Brute-force protection:
  - Max. 5 failed attempts
  - Account lockout: 30 perc
- [ ] ✅ Session beállítások:
  - Access token lifespan: 5 perc
  - SSO session idle: 30 perc
  - SSO session max: 10 óra

**Ellenőrzés:**
```bash
# Keycloak admin console
# Realm Settings → Security Defenses → Brute Force Detection
# Realm Settings → Tokens → Access Token Lifespan
# Authentication → Password Policy
```

### Event logging
- [ ] ✅ **Login Events** naplózása engedélyezve
- [ ] ✅ **Admin Events** naplózása engedélyezve
- [ ] ✅ Event listeners beállítva (email alert kritikus eseményekhez)
- [ ] ✅ Log retention policy beállítva (30-90 nap)

---

## 📊 6. Monitoring és logging

### Application logging
- [ ] ✅ Keycloak log level: **WARN** vagy **ERROR** production-ben
- [ ] ✅ JSON formátumú logok
- [ ] ✅ Centralizált log gyűjtés (ELK stack, Graylog, Loki)
- [ ] ✅ Log rotation beállítva (logrotate)

### Metrics és monitoring
- [ ] ✅ Prometheus metrics engedélyezve (`KC_METRICS_ENABLED=true`)
- [ ] ✅ Grafana dashboard beállítva
- [ ] ✅ Alert szabályok konfigurálva:
  - High CPU/RAM usage
  - Cert expiry warning (30 nap)
  - Failed login attempts spike
  - Database connection errors

### Health checks
- [ ] ✅ Keycloak health endpoint működik (`/health/ready`)
- [ ] ✅ Uptime monitoring (UptimeRobot, Pingdom)
- [ ] ✅ Alert ha 5+ percig nem elérhető

**Ellenőrzés:**
```bash
# Health check
curl -k https://keycloak.yourdomain.com:8443/health/ready

# Metrics
curl -k https://keycloak.yourdomain.com:8443/metrics
```

---

## 💾 7. Backup és disaster recovery

### Adatbázis backup
- [ ] ✅ **Automatikus napi backup** (pg_dump)
- [ ] ✅ Backup retention: **30 nap**
- [ ] ✅ Backup titkosítva (gpg vagy AES-256)
- [ ] ✅ Backup **offsite** tárolása (S3, Azure Blob, Google Cloud Storage)
- [ ] ✅ Restore teszt havonta

### Realm export
- [ ] ✅ Keycloak realm export rendszeresen (hetente)
- [ ] ✅ Realm export version control-ba (git)

### Disaster recovery plan
- [ ] ✅ DR dokumentáció frissítve
- [ ] ✅ RTO (Recovery Time Objective) definiálva
- [ ] ✅ RPO (Recovery Point Objective) definiálva
- [ ] ✅ DR teszt félévente

**Backup script példa:**
```bash
#!/bin/bash
# PostgreSQL backup
docker exec keycloak-postgres-prod pg_dump -U keycloak keycloak > backup-$(date +%Y%m%d).sql

# Realm export
docker exec keycloak-prod /opt/keycloak/bin/kc.sh export --dir /tmp/export --realm biometric-2fa
```

---

## 🚀 8. Deployment és CI/CD

### Deployment process
- [ ] ✅ **Blue-green deployment** vagy rolling update
- [ ] ✅ Smoke test után production switch
- [ ] ✅ Rollback plan dokumentálva
- [ ] ✅ Zero-downtime deployment

### CI/CD pipeline
- [ ] ✅ Automatikus teszt futtatás (unit, integration)
- [ ] ✅ Security scan (SAST, DAST)
- [ ] ✅ Dependency vulnerability scan
- [ ] ✅ Manual approval gate production deploy előtt

### Change management
- [ ] ✅ Minden változás dokumentálva (changelog)
- [ ] ✅ Maintenance window kommunikálva
- [ ] ✅ Post-deployment validation

---

## 🔍 9. Compliance és audit

### GDPR compliance
- [ ] ✅ Személyes adatok titkosítva (at-rest, in-transit)
- [ ] ✅ User consent management
- [ ] ✅ Right to be forgotten (user deletion)
- [ ] ✅ Data portability (user export)
- [ ] ✅ Privacy policy frissítve

### Audit trail
- [ ] ✅ Minden admin tevékenység naplózva
- [ ] ✅ User authentication events naplózva
- [ ] ✅ Log immutability biztosítva (write-once storage)
- [ ] ✅ Log retention policy compliance szerint

### Security audit
- [ ] ✅ Penetration test évente
- [ ] ✅ Vulnerability assessment negyedévente
- [ ] ✅ Security policy dokumentáció naprakész
- [ ] ✅ Incident response plan kész

---

## 📱 10. Application integration

### Angular frontend
- [ ] ✅ **Production environment config** használata
- [ ] ✅ `environment.prod.ts` frissítve (Keycloak URL, realm)
- [ ] ✅ HTTPS-only kommunikáció
- [ ] ✅ CORS policy szigorú (csak engedélyezett origin-ek)
- [ ] ✅ Content Security Policy (CSP) beállítva

### Spring Boot backend
- [ ] ✅ **Production profile** aktiválva
- [ ] ✅ `application-prod.yml` használata
- [ ] ✅ JWT signature validation működik
- [ ] ✅ CORS csak production origin-ekhez
- [ ] ✅ Rate limiting beállítva (API throttling)

### Client configuration
- [ ] ✅ Valid Redirect URIs szigorúan beállítva (NEM wildcard!)
- [ ] ✅ Web Origins pontosan definiálva
- [ ] ✅ Client authentication kötelező (confidential client)
- [ ] ✅ PKCE engedélyezve public client-eknél

---

## ⚡ 11. Performance és skálázás

### Performance optimization
- [ ] ✅ Database connection pool méretezve
- [ ] ✅ Cache beállítások optimalizálva
- [ ] ✅ Session clustering (ha multi-instance)
- [ ] ✅ Static asset CDN használat

### Skálázás előkészítés
- [ ] ✅ Load balancer konfigurálva (ha szükséges)
- [ ] ✅ Sticky session beállítva
- [ ] ✅ Database read replicas (ha nagy terhelés)
- [ ] ✅ Auto-scaling policy definiálva

### Performance monitoring
- [ ] ✅ Response time tracking
- [ ] ✅ Database query performance
- [ ] ✅ Cache hit ratio monitoring
- [ ] ✅ Load testing eredmények dokumentálva

---

## 🧪 12. Testing

### Pre-production testing
- [ ] ✅ **Smoke test** minden deploy után
- [ ] ✅ Login/logout flow működik
- [ ] ✅ Token refresh működik
- [ ] ✅ 2FA/WebAuthn működik
- [ ] ✅ Admin API működik

### Security testing
- [ ] ✅ OWASP Top 10 ellenőrzés
- [ ] ✅ SQL injection teszt
- [ ] ✅ XSS teszt
- [ ] ✅ CSRF protection teszt
- [ ] ✅ Session hijacking védelem

### Load testing
- [ ] ✅ Concurrent user teszt (target: 1000+ user)
- [ ] ✅ Peak load teszt
- [ ] ✅ Stress test (failure scenario)
- [ ] ✅ Soak test (24h continuous load)

---

## 📞 13. Incident response

### Monitoring alerts
- [ ] ✅ **24/7 monitoring** aktív
- [ ] ✅ Alert notification (email, SMS, Slack)
- [ ] ✅ On-call rotation beállítva
- [ ] ✅ Alert escalation policy

### Incident response plan
- [ ] ✅ IR playbook dokumentálva
- [ ] ✅ Contact list frissítve
- [ ] ✅ Communication template-ek készen
- [ ] ✅ Post-mortem process definiálva

### Backup contacts
- [ ] ✅ Keycloak support kontakt (Red Hat)
- [ ] ✅ Cloud provider support
- [ ] ✅ Security team contact
- [ ] ✅ Legal/compliance contact

---

## 📝 14. Dokumentáció

### Technical documentation
- [ ] ✅ Architecture diagram naprakész
- [ ] ✅ Deployment guide frissítve
- [ ] ✅ Troubleshooting guide kész
- [ ] ✅ API dokumentáció publikálva

### Operational documentation
- [ ] ✅ Runbook minden szolgáltatáshoz
- [ ] ✅ Disaster recovery playbook
- [ ] ✅ Maintenance procedures
- [ ] ✅ Rollback procedures

### User documentation
- [ ] ✅ End-user guide elérhető
- [ ] ✅ Admin guide frissítve
- [ ] ✅ FAQ dokumentum
- [ ] ✅ Security best practices guide

---

## ✅ Go-Live Checklist

**Deployment előtt (D-7):**
- [ ] Security audit befejezve
- [ ] Load testing befejezve
- [ ] Backup és restore teszt sikeres
- [ ] DR teszt sikeres
- [ ] Monitoring és alerting működik

**Deployment előtt (D-1):**
- [ ] Production environment ready
- [ ] SSL certificate érvényes (90+ nap)
- [ ] Minden jelszó megváltoztatva
- [ ] Deployment plan reviewed
- [ ] Rollback plan ready

**Go-Live nap:**
- [ ] Backup készítve
- [ ] Deployment végrehajtva
- [ ] Smoke test sikeres
- [ ] Monitoring ellenőrizve
- [ ] Post-deployment kommunikáció

**Deployment után (D+1):**
- [ ] 24h monitoring review
- [ ] User feedback gyűjtés
- [ ] Performance metrics ellenőrzés
- [ ] Error rate ellenőrzés
- [ ] Post-deployment report

---

## 🎯 Prioritized Security Quick Wins

Ha gyors security javításra van szükség, kezd ezekkel:

### 🔴 CRITICAL (azonnal)
1. ✅ Admin jelszó megváltoztatása
2. ✅ Database jelszó megváltoztatása
3. ✅ SSH kulcs alapú auth (jelszó tiltva)
4. ✅ Firewall engedélyezése (csak 22, 80, 443, 8443)
5. ✅ Let's Encrypt cert (NEM self-signed)

### 🟠 HIGH (1 héten belül)
6. ✅ Brute-force protection engedélyezése
7. ✅ Event logging beállítása
8. ✅ Automatikus backup beállítása
9. ✅ Monitoring és alerting
10. ✅ SSL Labs A rating

### 🟡 MEDIUM (1 hónapon belül)
11. ✅ Password policy szigorítása
12. ✅ Admin 2FA engedélyezése
13. ✅ Session timeout beállítása
14. ✅ CORS policy szigorítása
15. ✅ Vulnerability scanning

---

## 📞 Support és eszközök

**Security scanning tools:**
- [OWASP ZAP](https://www.zaproxy.org/) - Web app security scanner
- [Trivy](https://github.com/aquasecurity/trivy) - Container vulnerability scanner
- [Nmap](https://nmap.org/) - Network port scanner

**Monitoring tools:**
- [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
- [UptimeRobot](https://uptimerobot.com/) - Uptime monitoring
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL/TLS testing

**Documentation:**
- [Keycloak Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

---

## 🏆 Security Maturity Levels

**Level 1 - Basic (Development):**
- Self-signed cert
- Default passwords
- No monitoring
- Manual deployment

**Level 2 - Improved (Staging):**
- Let's Encrypt cert
- Changed passwords
- Basic monitoring
- Some automation

**Level 3 - Production-Ready:**
- ✅ CA-signed cert
- ✅ Strong passwords (password manager)
- ✅ Full monitoring + alerts
- ✅ CI/CD pipeline
- ✅ Automated backups

**Level 4 - Enterprise:**
- ✅ Wildcard cert
- ✅ Secrets management (Vault)
- ✅ 24/7 SOC
- ✅ Multi-region HA
- ✅ Compliance certified (SOC2, ISO27001)

**Cél:** Minimum **Level 3** production environment-hez!

---

**Készítette:** Claude Code
**Verzió:** 1.0
**Dátum:** 2025-10-31

**Következő lépés:** [LETSENCRYPT-PRODUCTION-SETUP.md](LETSENCRYPT-PRODUCTION-SETUP.md)