# Példa Angular Admin Felület

## Egyszerű Admin Dashboard 2FA kezeléshez

Ez egy egyszerű példa, hogyan készíthetsz saját admin felületet az Angular alkalmazásodban.

---

## 1. Admin Component (admin.component.ts)

```typescript
import { Component, OnInit } from '@angular/core';
import { KeycloakAdminService } from './services/keycloak-admin.service';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  requiredActions: string[];
}

interface WebAuthnDevice {
  id: string;
  type: string;
  userLabel: string;
  createdDate: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  webAuthnDevices: WebAuthnDevice[] = [];

  // WebAuthn Policy beállítások
  webAuthnPolicy = {
    authenticatorAttachment: 'not specified',
    userVerification: 'preferred'
  };

  loading = false;
  message = '';

  constructor(private adminService: KeycloakAdminService) {}

  async ngOnInit() {
    await this.loadUsers();
    await this.loadWebAuthnPolicy();
  }

  // === FELHASZNÁLÓK KEZELÉSE ===

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.adminService.getUsers().toPromise();
      this.message = `${this.users.length} felhasználó betöltve`;
    } catch (error) {
      this.message = 'Hiba a felhasználók betöltésekor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async selectUser(user: User) {
    this.selectedUser = user;
    await this.loadUserWebAuthnDevices(user.id);
  }

  async createUser(formData: any) {
    this.loading = true;
    try {
      await this.adminService.createUser({
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: formData.password,
          temporary: false
        }]
      }).toPromise();

      this.message = 'Felhasználó sikeresen létrehozva';
      await this.loadUsers();
    } catch (error) {
      this.message = 'Hiba a felhasználó létrehozásakor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(userId: string, newPassword: string) {
    this.loading = true;
    try {
      await this.adminService.resetPassword(userId, newPassword);
      this.message = 'Jelszó sikeresen módosítva';
    } catch (error) {
      this.message = 'Hiba a jelszó módosításakor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  // === 2FA KEZELÉSE ===

  async requireWebAuthn(userId: string) {
    this.loading = true;
    try {
      await this.adminService.requireWebAuthn(userId).toPromise();
      this.message = 'WebAuthn regisztráció beállítva';
      await this.loadUsers();
    } catch (error) {
      this.message = 'Hiba a WebAuthn beállításakor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async requireOTP(userId: string) {
    this.loading = true;
    try {
      await this.adminService.requireOTP(userId).toPromise();
      this.message = 'OTP regisztráció beállítva';
      await this.loadUsers();
    } catch (error) {
      this.message = 'Hiba az OTP beállításakor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async loadUserWebAuthnDevices(userId: string) {
    this.loading = true;
    try {
      const credentials = await this.adminService.getWebAuthnDevices(userId).toPromise();
      this.webAuthnDevices = credentials.filter(c => c.type === 'webauthn');
      this.message = `${this.webAuthnDevices.length} WebAuthn eszköz találva`;
    } catch (error) {
      this.message = 'Hiba az eszközök betöltésekor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async deleteWebAuthnDevice(userId: string, credentialId: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt az eszközt?')) {
      return;
    }

    this.loading = true;
    try {
      await this.adminService.deleteWebAuthnDevice(userId, credentialId).toPromise();
      this.message = 'Eszköz törölve';
      await this.loadUserWebAuthnDevices(userId);
    } catch (error) {
      this.message = 'Hiba az eszköz törlésekor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  // === WEBAUTHN POLICY KEZELÉSE ===

  async loadWebAuthnPolicy() {
    this.loading = true;
    try {
      const realm = await this.adminService.getRealmSettings().toPromise();
      this.webAuthnPolicy = {
        authenticatorAttachment: realm.webAuthnPolicyAuthenticatorAttachment || 'not specified',
        userVerification: realm.webAuthnPolicyUserVerificationRequirement || 'preferred'
      };
    } catch (error) {
      console.error('Hiba a policy betöltésekor', error);
    } finally {
      this.loading = false;
    }
  }

  async updateWebAuthnPolicy() {
    this.loading = true;
    try {
      await this.adminService.updateWebAuthnPolicy({
        webAuthnPolicyAuthenticatorAttachment: this.webAuthnPolicy.authenticatorAttachment,
        webAuthnPolicyUserVerificationRequirement: this.webAuthnPolicy.userVerification
      }).toPromise();

      this.message = 'WebAuthn Policy frissítve';
    } catch (error) {
      this.message = 'Hiba a policy frissítésekor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  setPolicyPreset(preset: string) {
    switch (preset) {
      case 'platform':
        this.webAuthnPolicy = {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        };
        this.message = 'Preset: Beépített biometrikus (Windows Hello, Touch ID)';
        break;

      case 'cross-platform':
        this.webAuthnPolicy = {
          authenticatorAttachment: 'cross-platform',
          userVerification: 'required'
        };
        this.message = 'Preset: Telefonos QR kódos biometrikus';
        break;

      case 'any':
        this.webAuthnPolicy = {
          authenticatorAttachment: 'not specified',
          userVerification: 'preferred'
        };
        this.message = 'Preset: Bármilyen eszköz';
        break;
    }
  }

  // === SESSION KEZELÉSE ===

  async logoutUser(userId: string) {
    if (!confirm('Biztosan ki szeretnéd jelentkeztetni ezt a felhasználót?')) {
      return;
    }

    this.loading = true;
    try {
      await this.adminService.logoutUser(userId).toPromise();
      this.message = 'Felhasználó kijelentkeztetve';
    } catch (error) {
      this.message = 'Hiba a kijelentkeztetéskor';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
}
```

---

## 2. Admin Template (admin.component.html)

```html
<div class="admin-container">
  <h1>Keycloak Admin - 2FA Kezelés</h1>

  <!-- Üzenetek -->
  <div class="message" *ngIf="message">
    {{ message }}
  </div>

  <!-- Loading spinner -->
  <div class="loading" *ngIf="loading">
    Betöltés...
  </div>

  <!-- === WEBAUTHN POLICY BEÁLLÍTÁSOK === -->
  <div class="section policy-section">
    <h2>WebAuthn Policy Beállítások</h2>

    <!-- Preset gombok -->
    <div class="preset-buttons">
      <button (click)="setPolicyPreset('platform')" class="btn btn-preset">
        🖥️ Beépített biometrikus
        <small>(Windows Hello, Touch ID)</small>
      </button>

      <button (click)="setPolicyPreset('cross-platform')" class="btn btn-preset">
        📱 Telefonos QR kódos
        <small>(iPhone, Android biometrikus)</small>
      </button>

      <button (click)="setPolicyPreset('any')" class="btn btn-preset">
        🔑 Bármilyen eszköz
        <small>(USB key, telefon, beépített)</small>
      </button>
    </div>

    <!-- Policy beállítások -->
    <div class="policy-settings">
      <div class="form-group">
        <label>Authenticator Attachment:</label>
        <select [(ngModel)]="webAuthnPolicy.authenticatorAttachment" class="form-control">
          <option value="not specified">Not Specified (mindkettő)</option>
          <option value="platform">Platform (beépített)</option>
          <option value="cross-platform">Cross-Platform (külső)</option>
        </select>
      </div>

      <div class="form-group">
        <label>User Verification:</label>
        <select [(ngModel)]="webAuthnPolicy.userVerification" class="form-control">
          <option value="required">Required (kötelező biometrikus)</option>
          <option value="preferred">Preferred (előnyben részesített)</option>
          <option value="discouraged">Discouraged (nem kéri)</option>
        </select>
      </div>

      <button (click)="updateWebAuthnPolicy()" class="btn btn-primary" [disabled]="loading">
        💾 Policy mentése
      </button>
    </div>
  </div>

  <!-- === FELHASZNÁLÓK LISTA === -->
  <div class="section users-section">
    <h2>Felhasználók</h2>

    <button (click)="loadUsers()" class="btn btn-secondary" [disabled]="loading">
      🔄 Frissítés
    </button>

    <table class="users-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Név</th>
          <th>2FA Státusz</th>
          <th>Műveletek</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of users"
            [class.selected]="selectedUser?.id === user.id"
            (click)="selectUser(user)">
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>
            <span *ngIf="user.requiredActions.includes('webauthn-register')" class="badge badge-warning">
              WebAuthn regisztráció szükséges
            </span>
            <span *ngIf="user.requiredActions.includes('CONFIGURE_TOTP')" class="badge badge-warning">
              OTP regisztráció szükséges
            </span>
            <span *ngIf="user.requiredActions.length === 0" class="badge badge-success">
              ✅ Beállítva
            </span>
          </td>
          <td>
            <button (click)="requireWebAuthn(user.id); $event.stopPropagation()" class="btn btn-sm">
              🔐 WebAuthn
            </button>
            <button (click)="requireOTP(user.id); $event.stopPropagation()" class="btn btn-sm">
              📱 OTP
            </button>
            <button (click)="logoutUser(user.id); $event.stopPropagation()" class="btn btn-sm btn-danger">
              🚪 Logout
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- === KIVÁLASZTOTT FELHASZNÁLÓ RÉSZLETEI === -->
  <div class="section user-details" *ngIf="selectedUser">
    <h2>{{ selectedUser.username }} - WebAuthn Eszközök</h2>

    <div class="devices-list">
      <div *ngIf="webAuthnDevices.length === 0" class="no-devices">
        Nincs regisztrált WebAuthn eszköz
      </div>

      <div *ngFor="let device of webAuthnDevices" class="device-card">
        <div class="device-info">
          <strong>{{ device.userLabel }}</strong>
          <small>Létrehozva: {{ device.createdDate | date:'medium' }}</small>
        </div>
        <button (click)="deleteWebAuthnDevice(selectedUser.id, device.id)"
                class="btn btn-sm btn-danger">
          🗑️ Törlés
        </button>
      </div>
    </div>

    <div class="actions">
      <button (click)="requireWebAuthn(selectedUser.id)" class="btn btn-primary">
        ➕ Új WebAuthn eszköz regisztrálása
      </button>
    </div>
  </div>
</div>
```

---

## 3. Stílusok (admin.component.css)

```css
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.message {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* Policy Section */
.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.btn-preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  text-align: center;
}

.btn-preset small {
  font-size: 12px;
  margin-top: 5px;
  color: #666;
}

.policy-settings {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 15px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
}

.form-control {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Users Table */
.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.users-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.users-table tr {
  cursor: pointer;
  transition: background 0.2s;
}

.users-table tr:hover {
  background: #f9f9f9;
}

.users-table tr.selected {
  background: #e3f2fd;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.badge-success {
  background: #4caf50;
  color: white;
}

.badge-warning {
  background: #ff9800;
  color: white;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
  margin-right: 5px;
}

/* Devices */
.devices-list {
  margin: 15px 0;
}

.no-devices {
  text-align: center;
  padding: 40px;
  color: #999;
}

.device-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.device-info {
  display: flex;
  flex-direction: column;
}

.device-info small {
  color: #666;
  margin-top: 5px;
}

.actions {
  margin-top: 20px;
  text-align: center;
}
```

---

## 4. Module beállítás (app.module.ts)

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { KeycloakAdminService } from './services/keycloak-admin.service';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    KeycloakAdminService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## 5. Route beállítás

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  { path: 'admin', component: AdminComponent },
  // ... más route-ok
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

---

## Összefoglalás - Mit tud ez az admin felület:

✅ **WebAuthn Policy kezelés**
- Preset gombok (beépített / telefonos / bármilyen)
- Authenticator Attachment váltás
- User Verification beállítás

✅ **Felhasználók kezelése**
- Listázás
- 2FA kikényszerítése (WebAuthn / OTP)
- Kijelentkeztetés

✅ **WebAuthn eszközök kezelése**
- Felhasználó eszközeinek listázása
- Eszköz törlése
- Új eszköz regisztrálása

✅ **Valós idejű frissítés**
- Minden változtatás azonnal érvénybe lép
- Nincs szükség config újratöltésre

Ez a felület 100%-ban a **Keycloak Admin REST API**-ra épül, ugyanazokat a funkciókat használva, mint a beépített Admin Console.
