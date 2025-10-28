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
      // MÓDSZER 1: loadUserProfile + getUsername
      await this.keycloak.loadUserProfile();
      this.username = this.keycloak.getUsername();
      this.isAdmin = this.keycloak.isUserInRole('ADMIN');
      console.log('APP: Username =', this.username, '| isAdmin =', this.isAdmin);
    } catch (error) {
      console.warn('APP: Method 1 failed, trying token method...', error);

      // MÓDSZER 2: Token alapján (fallback)
      try {
        const keycloakInstance = this.keycloak.getKeycloakInstance();
        if (keycloakInstance.tokenParsed) {
          const token = keycloakInstance.tokenParsed as any;
          this.username = token.preferred_username || token.name || 'Felhasználó';

          const realmAccess = token.realm_access;
          this.isAdmin = realmAccess?.roles?.includes('ADMIN') || false;

          console.log('APP: Username from token =', this.username, '| isAdmin =', this.isAdmin);
        } else {
          console.error('APP: No token available');
          this.username = '';
          this.isAdmin = false;
        }
      } catch (tokenError) {
        console.error('APP: Token method also failed:', tokenError);
        this.username = '';
        this.isAdmin = false;
      }
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
