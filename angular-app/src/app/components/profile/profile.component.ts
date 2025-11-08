import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { KeycloakService } from 'keycloak-angular';
import { UserService } from '../../services/user.service';
import { LoggerService } from '../../services/logger.service';
import { ProfileData } from '../../models/user.model';
import { LOG_PREFIXES, DEFAULT_VALUES } from '../../constants/app.constants';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileData: ProfileData | null = null;
  username = '';
  email = '';
  roles: string[] = [];

  constructor(
    private apiService: ApiService,
    private keycloak: KeycloakService,
    private userService: UserService,
    private logger: LoggerService
  ) {}

  async ngOnInit(): Promise<void> {
    this.logger.info(LOG_PREFIXES.PROFILE, 'Component initialized');
    this.loadUserInfo();
    this.loadBackendProfile();
  }

  private loadUserInfo(): void {
    try {
      const userInfo = this.userService.getUserInfoFromToken();

      this.username = userInfo.username;
      this.email = userInfo.email;
      this.roles = userInfo.roles;

      this.logger.info(LOG_PREFIXES.PROFILE, 'User info loaded from token:');
      this.logger.debug('  - Username:', this.username);
      this.logger.debug('  - Email:', this.email);
      this.logger.debug('  - Roles:', this.roles);
    } catch (error) {
      this.logger.error('PROFILE: Error loading user info:', error);
      this.username = DEFAULT_VALUES.ERROR_USERNAME;
      this.email = DEFAULT_VALUES.FALLBACK_EMAIL;
      this.roles = [];
    }
  }

  private loadBackendProfile(): void {
    this.logger.info(LOG_PREFIXES.PROFILE, 'Loading backend profile...');
    this.apiService.getUserProfile().subscribe({
      next: (data) => {
        this.logger.info(LOG_PREFIXES.PROFILE, 'Backend data received:', data);
        this.profileData = data;
      },
      error: (err) => {
        this.logger.error('PROFILE: Error loading backend data:', err);
        this.profileData = null;
      }
    });
  }

  async logout(): Promise<void> {
    this.logger.info(LOG_PREFIXES.PROFILE, 'Logout button clicked');
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      this.logger.error('PROFILE: Error during logout:', error);
    }
  }
}
