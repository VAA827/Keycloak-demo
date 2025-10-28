# 🔐 Keycloak 2FA Biometric Authentication System

[![Keycloak](https://img.shields.io/badge/Keycloak-23.0.0-blue.svg)](https://www.keycloak.org/)
[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)
[![WebAuthn](https://img.shields.io/badge/WebAuthn-FIDO2-orange.svg)](https://webauthn.guide/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Production-ready **Keycloak SSO** setup with **WebAuthn 2FA** biometric authentication, featuring **cross-platform** support for phone-based QR code biometric login (fingerprint/Face ID).

---

## ✨ Features

- 🔐 **WebAuthn 2FA** - FIDO2 biometric authentication
- 📱 **Phone QR Code Login** - Scan QR with phone, authenticate with fingerprint/Face ID
- 🖥️ **Platform Biometrics** - Windows Hello, Touch ID, Android biometrics
- 🔑 **Keycloak 23.0.0** - Latest stable IAM solution
- 🎨 **Angular Frontend** - Modern SPA with keycloak-angular integration
- ⚡ **Spring Boot Backend** - OAuth2 Resource Server
- 🐳 **Docker Environment** - Keycloak + PostgreSQL
- 🌍 **Cross-Platform** - Works on desktop, mobile, tablets
- 📚 **Comprehensive Docs** - 10+ guides in Hungarian
- 💾 **Backup/Restore** - Automated scripts for realm management
- 🔄 **Auto Token Refresh** - Seamless session management
- 🛡️ **Environment Config** - Separate dev/prod configurations

---

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- **Node.js 18+** (for Angular app)
- **Java 17+** (for Spring Boot backend)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/keycloak-2fa-biometric.git
cd keycloak-2fa-biometric
```

### 2. Start Keycloak (Docker)

```bash
docker-compose up -d
```

Wait 30-60 seconds for Keycloak to start:
```bash
docker logs keycloak --follow
# Wait for: "Keycloak started in..."
```

### 3. Access Admin Console

**URL:** https://localhost:8443/admin
**Username:** `admin`
**Password:** `admin123`

### 4. Test User Login (Angular App)

```bash
cd angular-app
npm install
ng serve
```

**URL:** http://localhost:4200
**Username:** `testuser`
**Password:** `Test123`

On first login:
1. WebAuthn registration screen appears
2. Choose "QR Code" option
3. Scan QR with your phone
4. Authenticate with fingerprint/Face ID
5. ✅ Logged in!

---

## 📚 Documentation

**Start here:** [START-HERE.md](START-HERE.md) - Complete project overview in Hungarian

### 🎓 For Beginners

| Document | Description | Time |
|----------|-------------|------|
| [BIOMETRIC-2FA-SETUP.md](BIOMETRIC-2FA-SETUP.md) | WebAuthn 2FA setup guide | 10 min |
| [QR-CODE-2FA-SETUP.md](QR-CODE-2FA-SETUP.md) | Phone QR code 2FA detailed guide | 10 min |
| [SSL-CERT-SETUP.md](SSL-CERT-SETUP.md) | SSL certificate management | 15 min |
| [README-BACKUP-RESTORE.md](README-BACKUP-RESTORE.md) | Backup & restore quick guide | 5 min |

### 🔧 For Administrators

| Document | Description | Time |
|----------|-------------|------|
| [ADMIN-CONSOLE-GUIDE.md](ADMIN-CONSOLE-GUIDE.md) | Keycloak Admin Console complete guide | 30 min |
| [ADMIN-SOLUTIONS-SUMMARY.md](ADMIN-SOLUTIONS-SUMMARY.md) | Admin solutions comparison | 15 min |

### 👨‍💻 For Developers

| Document | Description | Time |
|----------|-------------|------|
| [CUSTOM-ADMIN-API.md](CUSTOM-ADMIN-API.md) | REST API full documentation + examples | 45 min |
| [ANGULAR-ADMIN-COMPONENT-EXAMPLE.md](ANGULAR-ADMIN-COMPONENT-EXAMPLE.md) | Complete Angular admin component example | 60 min |
| [CODE-REVIEW-SSO-CLEANCODE.md](CODE-REVIEW-SSO-CLEANCODE.md) | Code review & best practices | 30 min |
| [CODE-REVIEW-FIXES-SUMMARY.md](CODE-REVIEW-FIXES-SUMMARY.md) | Implemented fixes summary | 20 min |
| [SESSION-CHANGES-LOG.md](SESSION-CHANGES-LOG.md) | All changes detailed log | 30 min |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Angular App (localhost:4200)               │   │
│  │  ├─ keycloak-angular integration                     │   │
│  │  ├─ Auto token refresh service                       │   │
│  │  └─ Environment-based config                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────┬───────────────────┘
                   │                       │
                   │ OIDC/OAuth2          │ REST API
                   │ (Authorization       │ (JWT Bearer Token)
                   │  Code Flow)          │
                   ▼                       ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  Keycloak (localhost:8443)   │ │  Spring Boot (localhost:8081)│
│  ┌────────────────────────┐  │ │  ┌───────────────────────┐  │
│  │  biometric-2fa Realm   │  │ │  │  OAuth2 Resource      │  │
│  │  ├─ WebAuthn Policy    │  │ │  │  Server               │  │
│  │  ├─ Users              │  │ │  │  ├─ JWT Validation    │  │
│  │  ├─ Clients            │  │ │  │  └─ CORS Config       │  │
│  │  └─ Flows              │  │ │  └───────────────────────┘  │
│  └────────────────────────┘  │ └─────────────────────────────┘
│  ┌────────────────────────┐  │
│  │  PostgreSQL Database   │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
        (Docker Container)
```

---

## 🛠️ Tech Stack

### Backend
- **Keycloak 23.0.0** - Identity & Access Management
- **PostgreSQL 15** - Database
- **Spring Boot 3.x** - Resource Server
- **Docker Compose** - Container orchestration

### Frontend
- **Angular 18+** - SPA Framework
- **keycloak-angular** - Keycloak integration
- **TypeScript** - Type-safe development
- **SCSS** - Styling

### Authentication
- **WebAuthn (FIDO2)** - Passwordless authentication
- **OAuth 2.0** - Authorization framework
- **OpenID Connect** - Identity layer
- **JWT** - Token-based authentication

---

## 📦 Installation & Setup

### 1. SSL Certificate Setup

The project includes a self-signed certificate for development. For production:

```bash
# Using mkcert (recommended for development)
mkcert -install
mkcert -pkcs12 -p12-file certs/keycloak.p12 localhost

# See SSL-CERT-SETUP.md for detailed instructions
```

### 2. Keycloak Environment

```bash
# Start Keycloak + PostgreSQL
docker-compose up -d

# Check logs
docker logs keycloak --follow

# Stop
docker-compose down
```

### 3. Angular Frontend

```bash
cd angular-app

# Install dependencies
npm install

# Development server
ng serve
# Access: http://localhost:4200

# Production build
ng build --configuration production
```

### 4. Spring Boot Backend

```bash
cd backend/keycloak-demo

# Development
./mvnw spring-boot:run
# Access: http://localhost:8081

# Production
./mvnw clean package
java -jar target/keycloak-demo.jar --spring.profiles.active=prod
```

---

## 🔧 Configuration

### Environment Variables

**Angular - `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  keycloak: {
    url: 'https://localhost:8443',
    realm: 'biometric-2fa',
    clientId: 'angular-app'
  }
};
```

**Spring Boot - `application-dev.yml`:**
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://localhost:8443/realms/biometric-2fa
```

See [CODE-REVIEW-FIXES-SUMMARY.md](CODE-REVIEW-FIXES-SUMMARY.md) for complete configuration guide.

---

## 💾 Backup & Restore

### Automatic Backup

**Linux/Mac:**
```bash
bash backup-restore.sh
```

**Windows:**
```powershell
.\backup-restore.ps1
```

**Output:**
```
keycloak-backup/
├── biometric-2fa-backup-TIMESTAMP.json  ← Realm export
├── docker-compose-backup-TIMESTAMP.yaml
├── angular-config/
├── docs-backup-TIMESTAMP/
└── BACKUP-INFO-TIMESTAMP.txt
```

### Restore

```bash
bash restore.sh keycloak-backup/biometric-2fa-backup-*.json
```

---

## 🧪 Testing Scenarios

### 1. Basic Login Flow
```
1. Open http://localhost:4200
2. Click "Login"
3. Enter: testuser / Test123
4. Complete WebAuthn registration (first time)
5. ✅ Logged in!
```

### 2. Phone QR Code 2FA
```
1. Computer: Login with password
2. QR code appears
3. Phone: Open camera / Chrome
4. Scan QR code
5. Phone: Biometric authentication
6. ✅ Computer: Automatically logged in
```

### 3. Token Refresh (Automatic)
```
1. Login to app
2. Open DevTools → Console
3. Wait 1-2 minutes
4. Look for: "Token successfully refreshed"
5. ✅ Session maintained automatically
```

---

## 📊 Project Structure

```
keycloak-2fa-biometric/
├── 📁 angular-app/              # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # UI components
│   │   │   ├── guards/          # Route guards
│   │   │   ├── interceptors/    # HTTP interceptors
│   │   │   ├── services/        # Business logic
│   │   │   └── app.config.ts    # Keycloak config
│   │   └── environments/        # Environment configs
│   └── package.json
│
├── 📁 backend/                  # Spring Boot backend
│   └── keycloak-demo/
│       └── src/main/
│           ├── java/
│           │   └── com/example/keycloakdemo/
│           │       ├── config/  # Security config
│           │       └── controller/
│           └── resources/
│               ├── application.yml
│               ├── application-dev.yml
│               └── application-prod.yml
│
├── 📁 certs/                    # SSL certificates (gitignored)
│   ├── keycloak.p12
│   └── README.md
│
├── 📁 keycloak-backup/          # Backups (gitignored)
│   └── biometric-2fa-realm.json # Template
│
├── 📄 docker-compose.yaml       # Docker configuration
├── 📄 .gitignore                # Git ignore rules
│
├── 🔧 backup-restore.sh         # Backup script (Bash)
├── 🔧 backup-restore.ps1        # Backup script (PowerShell)
├── 🔧 restore.sh                # Restore script
│
└── 📚 Documentation/ (10+ guides in Hungarian)
    ├── README.md                         # This file
    ├── START-HERE.md                     # Project overview
    ├── BIOMETRIC-2FA-SETUP.md
    ├── QR-CODE-2FA-SETUP.md
    ├── ADMIN-CONSOLE-GUIDE.md
    ├── CUSTOM-ADMIN-API.md
    ├── CODE-REVIEW-SSO-CLEANCODE.md
    ├── CODE-REVIEW-FIXES-SUMMARY.md
    └── SESSION-CHANGES-LOG.md
```

---

## 🎯 Use Cases

### 1. Corporate SSO
Single Sign-On for internal applications with biometric 2FA security.

### 2. Banking/Finance
High-security authentication for financial applications.

### 3. Healthcare
HIPAA-compliant authentication with biometric verification.

### 4. E-Commerce
Secure customer authentication with passwordless login option.

### 5. Education
Student/teacher portal with modern biometric authentication.

---

## 🔒 Security Features

- ✅ **WebAuthn (FIDO2)** - Phishing-resistant authentication
- ✅ **Biometric Verification** - User verification required
- ✅ **Brute Force Protection** - Account lockout after 5 failed attempts
- ✅ **HTTPS/TLS** - Encrypted communication
- ✅ **JWT Token Validation** - Backend token verification
- ✅ **CORS Protection** - Configured allowed origins
- ✅ **Session Management** - Auto token refresh, configurable timeout
- ✅ **Event Logging** - Audit trail for all authentication events

---

## ⚠️ Important Notes

### Development vs Production

**Development (Current Setup):**
- Self-signed SSL certificate
- `localhost` URLs
- Debug logging enabled (fixed in recent commits)
- Test credentials in code

**Production Checklist:**
1. ✅ Change admin password from `admin123`
2. ✅ Use proper SSL certificate (Let's Encrypt / CA-signed)
3. ✅ Update environment configs (production URLs)
4. ✅ Enable debug logging to WARN/ERROR only
5. ✅ Set strong database passwords
6. ✅ Configure firewall rules
7. ✅ Set up monitoring & alerts
8. ✅ Regular backups scheduled

See [CODE-REVIEW-FIXES-SUMMARY.md](CODE-REVIEW-FIXES-SUMMARY.md) for production preparation details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (follow conventional commits)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- Follow Angular style guide
- Write unit tests for new features
- Update documentation
- Follow clean code principles (see CODE-REVIEW-SSO-CLEANCODE.md)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Troubleshooting

### "Page not found" in Angular app
**Solution:** Check realm name in `angular-app/src/app/app.config.ts` matches Keycloak realm (`biometric-2fa`)

### "Keycloak not responding"
```bash
docker ps | grep keycloak
docker logs keycloak --tail 50
docker-compose restart keycloak
```

### "WebAuthn registration not appearing"
**Checklist:**
- ✅ Using HTTPS? (required for WebAuthn)
- ✅ Browser supports WebAuthn? (Chrome/Edge recommended)
- ✅ Biometric device configured? (Windows Hello, Touch ID, etc.)
- ✅ Required action set in Admin Console?

### "Admin token unauthorized (401)"
**Cause:** Token expires after 60 seconds
**Solution:** Get new token before each API call

See detailed troubleshooting in [START-HERE.md](START-HERE.md#-hibaelhárítás)

---

## 🌟 Roadmap

- [ ] Multi-language support (English translations)
- [ ] Additional biometric providers (YubiKey, etc.)
- [ ] React/Vue.js frontend examples
- [ ] Kubernetes deployment configs
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] Docker Hub images
- [ ] Helm charts

---

## 📞 Support

**Documentation:** Start with [START-HERE.md](START-HERE.md)

**Issues:** [GitHub Issues](https://github.com/YOUR-USERNAME/keycloak-2fa-biometric/issues)

**Official Docs:**
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)

---

## 🎉 Acknowledgments

- **Keycloak** - Red Hat's excellent IAM solution
- **WebAuthn/FIDO2** - Passwordless authentication standard
- **Angular** - Modern web framework
- **Spring Boot** - Java application framework

---

## 📸 Screenshots

<!-- TODO: Add screenshots
### Admin Console
![Admin Console](docs/screenshots/admin-console.png)

### WebAuthn Registration
![WebAuthn Registration](docs/screenshots/webauthn-register.png)

### QR Code Login
![QR Code Login](docs/screenshots/qr-code-login.png)

### Angular App
![Angular App](docs/screenshots/angular-app.png)
-->

---

**Built with ❤️ using Claude Code**

**Last Updated:** 2025-10-28

---

### ⚡ Quick Links

- [📖 Getting Started](START-HERE.md)
- [🔧 Admin Guide](ADMIN-CONSOLE-GUIDE.md)
- [👨‍💻 API Documentation](CUSTOM-ADMIN-API.md)
- [🐛 Issue Tracker](https://github.com/YOUR-USERNAME/keycloak-2fa-biometric/issues)
- [💬 Discussions](https://github.com/YOUR-USERNAME/keycloak-2fa-biometric/discussions)

---

**Made with [Claude Code](https://claude.com/claude-code)**
