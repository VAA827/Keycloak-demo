import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileData: any = null;
  username = '';
  email = '';
  roles: string[] = [];

  constructor(
    private apiService: ApiService,
    private keycloak: KeycloakService
  ) {}

  async ngOnInit() {
    console.log('👤 PROFILE: Component initialized');
    await this.loadUserInfo();
    this.loadBackendProfile();
  }

  async loadUserInfo() {
    try {
      // MÓDSZER 1: Explicit profile betöltés
      try {
        await this.keycloak.loadUserProfile();
        this.username = this.keycloak.getUsername();
        this.roles = this.keycloak.getUserRoles();

        const userProfile = await this.keycloak.loadUserProfile();
        this.email = userProfile.email || 'Nem elérhető';

        console.log('PROFILE: User info (method 1) loaded');
        return;
      } catch (error) {
        console.warn('PROFILE: Method 1 failed, trying method 2...');
      }

      // MÓDSZER 2: Token alapján (fallback)
      const keycloakInstance = this.keycloak.getKeycloakInstance();
      if (keycloakInstance.tokenParsed) {
        const token = keycloakInstance.tokenParsed as any;
        this.username = token.preferred_username || token.name || 'Nem elérhető';
        this.email = token.email || 'Nem elérhető';

        const realmAccess = token.realm_access;
        this.roles = realmAccess?.roles || [];

        console.log('PROFILE: User info (method 2) loaded');
      } else {
        console.error('PROFILE: No token available');
        this.username = 'Nem elérhető';
        this.email = 'Nem elérhető';
        this.roles = [];
      }
    } catch (error) {
      console.error('PROFILE: Error loading user info:', error);
      this.username = 'Hiba';
      this.email = 'Hiba';
      this.roles = [];
    }
  }

  loadBackendProfile() {
    console.log('📡 PROFILE: Loading backend profile...');
    this.apiService.getUserProfile().subscribe({
      next: (data) => {
        console.log('PROFILE: Backend data received:', data);
        this.profileData = data;
      },
      error: (err) => {
        console.error('PROFILE: Error loading backend data:', err);
        this.profileData = { error: 'Nem sikerült betölteni' };
      }
    });
  }

  async logout() {
    console.log('🚪 PROFILE: Logout button clicked');
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      console.error('PROFILE: Error during logout:', error);
    }
  }
}
