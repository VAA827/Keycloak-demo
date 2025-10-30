import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Keycloak Demo App';
  isLoggedIn = false;
  username = '';
  isAdmin = false;

  constructor(private keycloak: KeycloakService) {}

  async ngOnInit() {
    console.log('🚀 APP: ngOnInit');
    await this.updateLoginStatus();
  }

  async updateLoginStatus() {
    try {
      this.isLoggedIn = await this.keycloak.isLoggedIn();
      console.log('APP: isLoggedIn =', this.isLoggedIn);

      if (this.isLoggedIn) {
        await this.loadUserInfo();
      } else {
        console.log('APP: Not logged in');
        this.username = '';
        this.isAdmin = false;
      }
    } catch (error) {
      console.error('APP: Error in updateLoginStatus:', error);
      this.isLoggedIn = false;
      this.username = '';
      this.isAdmin = false;
    }
  }

  async loadUserInfo() {
    console.log('APP: Loading user info...');

    try {
      // Közvetlenül a tokenből olvassuk ki az adatokat (CORS probléma elkerülése)
      const keycloakInstance = this.keycloak.getKeycloakInstance();
      if (keycloakInstance.tokenParsed) {
        const token = keycloakInstance.tokenParsed as any;

        // Username betöltése
        this.username = token.preferred_username || token.name || token.email || 'Felhasználó';

        // Admin role ellenőrzése
        const realmAccess = token.realm_access;
        this.isAdmin = realmAccess?.roles?.includes('ADMIN') || false;

        console.log('APP: User loaded from token:');
        console.log('  - Username:', this.username);
        console.log('  - Email:', token.email);
        console.log('  - Name:', token.name);
        console.log('  - Roles:', realmAccess?.roles);
        console.log('  - Is Admin:', this.isAdmin);
      } else {
        console.error('APP: No token available');
        this.username = 'Felhasználó';
        this.isAdmin = false;
      }
    } catch (error) {
      console.error('APP: Failed to load user info:', error);
      this.username = 'Felhasználó';
      this.isAdmin = false;
    }
  }

  async logout() {
    console.log('APP: Logout');
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      console.error('APP: Logout error:', error);
    }
  }
}
