# Saját Admin Felület - Keycloak REST API

Ha saját egyedi admin felületet szeretnél, a **Keycloak Admin REST API**-t használhatod.

## 1. Admin Token megszerzése

```javascript
// TypeScript / Angular példa
async getAdminToken() {
  const response = await fetch('https://localhost:8443/realms/master/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username: 'admin',
      password: 'admin123',
      grant_type: 'password',
      client_id: 'admin-cli'
    })
  });

  const data = await response.json();
  return data.access_token;
}
```

**Biztonság:**
- **Soha ne tárold az admin jelszót a frontend kódban!**
- Használj dedikált admin client-et
- Token lejárat: 60 másodperc (refresh token-nel újítsd!)

---

## 2. Felhasználók kezelése

### A) Felhasználók listázása

```javascript
async listUsers(token: string) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa/users',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

**Válasz:**
```json
[
  {
    "id": "00ce0ac3-ca09-40e1-9fb9-d18de92e1b19",
    "username": "testuser",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }
]
```

### B) Felhasználó létrehozása

```javascript
async createUser(token: string, userData: any) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa/users',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: userData.password,
          temporary: false
        }]
      })
    }
  );

  return response.status === 201;
}
```

### C) Jelszó módosítása

```javascript
async resetPassword(token: string, userId: string, newPassword: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}/reset-password`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'password',
        value: newPassword,
        temporary: false
      })
    }
  );

  return response.ok;
}
```

---

## 3. 2FA / WebAuthn kezelése

### A) Required Actions beállítása (2FA regisztrálás kikényszerítése)

```javascript
async requireWebAuthn(token: string, userId: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requiredActions: ['webauthn-register']
      })
    }
  );

  return response.ok;
}
```

**Lehetséges Required Actions:**
- `webauthn-register` - WebAuthn 2FA regisztráció
- `webauthn-register-passwordless` - Jelszó nélküli WebAuthn
- `CONFIGURE_TOTP` - Google/Microsoft Authenticator
- `UPDATE_PASSWORD` - Jelszó változtatás kényszerítése
- `VERIFY_EMAIL` - Email cím megerősítése
- `UPDATE_PROFILE` - Profil frissítés

### B) WebAuthn Credentials listázása

```javascript
async listWebAuthnDevices(token: string, userId: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}/credentials`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const credentials = await response.json();

  // Szűrés WebAuthn eszközökre
  return credentials.filter(c => c.type === 'webauthn');
}
```

**Válasz:**
```json
[
  {
    "id": "24edb9e3-a60a-4b2e-ac00-1921bfdf008a",
    "type": "webauthn",
    "userLabel": "iPhone Face ID",
    "createdDate": 1761641627348,
    "credentialData": "{...}"
  }
]
```

### C) WebAuthn eszköz törlése

```javascript
async deleteWebAuthnDevice(token: string, userId: string, credentialId: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}/credentials/${credentialId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.ok;
}
```

---

## 4. WebAuthn Policy módosítása

### A) Realm beállítások lekérése

```javascript
async getRealmSettings(token: string) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

### B) WebAuthn Policy módosítása

```javascript
async updateWebAuthnPolicy(token: string, policy: any) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa',
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 2FA WebAuthn Policy
        webAuthnPolicyAuthenticatorAttachment: policy.authenticatorAttachment, // 'platform', 'cross-platform', 'not specified'
        webAuthnPolicyUserVerificationRequirement: policy.userVerification, // 'required', 'preferred', 'discouraged'
        webAuthnPolicyRequireResidentKey: policy.requireResidentKey, // 'Yes', 'No', 'not specified'
        webAuthnPolicySignatureAlgorithms: ['ES256', 'RS256']
      })
    }
  );

  return response.ok;
}
```

**Példa hívás - Beépített biometrikus:**
```javascript
await updateWebAuthnPolicy(token, {
  authenticatorAttachment: 'platform',  // Beépített (Windows Hello, Touch ID)
  userVerification: 'required',         // Kötelező biometrikus
  requireResidentKey: 'not specified'   // 2FA mode
});
```

**Példa hívás - Telefonos QR kódos:**
```javascript
await updateWebAuthnPolicy(token, {
  authenticatorAttachment: 'cross-platform',  // Külső eszköz (telefon, USB key)
  userVerification: 'required',               // Kötelező biometrikus
  requireResidentKey: 'not specified'         // 2FA mode
});
```

---

## 5. Sessions kezelése

### A) Aktív sessions listázása

```javascript
async listUserSessions(token: string, userId: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}/sessions`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

### B) Felhasználó kijelentkeztetése (force logout)

```javascript
async logoutUser(token: string, userId: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/users/${userId}/logout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.ok;
}
```

---

## 6. Authentication Flow kezelése

### A) Flow-k listázása

```javascript
async listAuthFlows(token: string) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa/authentication/flows',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

### B) Flow másolása

```javascript
async copyAuthFlow(token: string, flowAlias: string, newName: string) {
  const response = await fetch(
    `https://localhost:8443/admin/realms/biometric-2fa/authentication/flows/${flowAlias}/copy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newName: newName
      })
    }
  );

  return response.ok;
}
```

### C) Browser Flow aktiválása

```javascript
async setBrowserFlow(token: string, flowAlias: string) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa',
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        browserFlow: flowAlias
      })
    }
  );

  return response.ok;
}
```

---

## 7. Events (Audit Log)

### A) Login események lekérése

```javascript
async getLoginEvents(token: string, userId?: string) {
  let url = 'https://localhost:8443/admin/realms/biometric-2fa/events';

  if (userId) {
    url += `?user=${userId}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}
```

**Válasz:**
```json
[
  {
    "time": 1761641627348,
    "type": "LOGIN",
    "userId": "00ce0ac3-ca09-40e1-9fb9-d18de92e1b19",
    "username": "testuser",
    "ipAddress": "192.168.1.100",
    "clientId": "angular-app",
    "details": {
      "auth_method": "webauthn"
    }
  }
]
```

### B) Admin események lekérése

```javascript
async getAdminEvents(token: string) {
  const response = await fetch(
    'https://localhost:8443/admin/realms/biometric-2fa/admin-events',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}
```

---

## 8. Token refresh (fontos!)

Az admin token 60 másodperc után lejár. Refresh token-nel újítsd:

```javascript
async refreshAdminToken(refreshToken: string) {
  const response = await fetch(
    'https://localhost:8443/realms/master/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'admin-cli'
      })
    }
  );

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token
  };
}
```

---

## 9. Teljes példa: Admin Service (Angular)

```typescript
// keycloak-admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeycloakAdminService {
  private baseUrl = 'https://localhost:8443';
  private realm = 'biometric-2fa';
  private adminToken: string | null = null;

  constructor(private http: HttpClient) {}

  // 1. Admin bejelentkezés
  async login(username: string, password: string): Promise<boolean> {
    const body = new URLSearchParams({
      username,
      password,
      grant_type: 'password',
      client_id: 'admin-cli'
    });

    try {
      const response: any = await this.http.post(
        `${this.baseUrl}/realms/master/protocol/openid-connect/token`,
        body.toString(),
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        }
      ).toPromise();

      this.adminToken = response.access_token;
      return true;
    } catch (error) {
      console.error('Admin login failed', error);
      return false;
    }
  }

  // 2. Felhasználók listázása
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/admin/realms/${this.realm}/users`,
      { headers: this.getHeaders() }
    );
  }

  // 3. Felhasználó létrehozása
  createUser(user: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/admin/realms/${this.realm}/users`,
      user,
      { headers: this.getHeaders() }
    );
  }

  // 4. 2FA kikényszerítése
  requireWebAuthn(userId: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
      { requiredActions: ['webauthn-register'] },
      { headers: this.getHeaders() }
    );
  }

  // 5. WebAuthn eszközök listázása
  getWebAuthnDevices(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/credentials`,
      { headers: this.getHeaders() }
    );
  }

  // 6. WebAuthn eszköz törlése
  deleteWebAuthnDevice(userId: string, credentialId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/credentials/${credentialId}`,
      { headers: this.getHeaders() }
    );
  }

  // 7. WebAuthn Policy frissítése
  updateWebAuthnPolicy(policy: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/admin/realms/${this.realm}`,
      policy,
      { headers: this.getHeaders() }
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json'
    });
  }
}
```

---

## 10. Biztonsági ajánlások

### ⚠️ Fontos:

1. **Ne használj admin/admin123-at production környezetben!**
2. **Admin client beállítása:**
   - Hozz létre dedikált admin client-et
   - Szolgáltatásfiókok engedélyezése (Service Accounts)
   - Realm admin role hozzárendelése

3. **Token biztonság:**
   - Tárold biztonságos helyen (HttpOnly cookie vagy secure storage)
   - Token refresh automatizálása
   - Logout után token törlése

4. **CORS beállítások:**
   - Admin Console → Clients → angular-app → Web Origins
   - Add hozzá: `http://localhost:4200`

5. **Role-based Access Control:**
   - Ne adj mindenkinek admin jogot
   - Készíts egyedi role-okat (pl. "user-manager", "2fa-admin")

---

## Összefoglalás:

✅ **Teljes Admin API dokumentáció**
✅ **TypeScript/Angular példakódok**
✅ **Felhasználók, 2FA, WebAuthn kezelése**
✅ **Valós idejű módosítások (nincs restart)**
✅ **Production-ready biztonsági ajánlások**

A Keycloak Admin REST API minden funkcióhoz API-t biztosít, amit a beépített Admin Console is használ.
