import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { UserService } from './services/user.service';
import { LoggerService } from './services/logger.service';
import { LOG_PREFIXES } from './constants/app.constants';

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

  constructor(
    private keycloak: KeycloakService,
    private userService: UserService,
    private logger: LoggerService
  ) {}

  async ngOnInit(): Promise<void> {
    this.logger.info(LOG_PREFIXES.APP, 'ngOnInit');
    await this.updateLoginStatus();
  }

  async updateLoginStatus(): Promise<void> {
    try {
      this.isLoggedIn = await this.userService.isLoggedIn();
      this.logger.info(LOG_PREFIXES.APP, 'isLoggedIn =', this.isLoggedIn);

      if (this.isLoggedIn) {
        this.loadUserInfo();
      } else {
        this.logger.info(LOG_PREFIXES.APP, 'Not logged in');
        this.resetUserInfo();
      }
    } catch (error) {
      this.logger.error('APP: Error in updateLoginStatus:', error);
      this.resetUserInfo();
    }
  }

  private loadUserInfo(): void {
    this.logger.info(LOG_PREFIXES.APP, 'Loading user info...');

    try {
      const userInfo = this.userService.getUserInfoFromToken();
      this.username = userInfo.username;
      this.isAdmin = userInfo.isAdmin;

      this.logger.info(LOG_PREFIXES.APP, 'User loaded from token:');
      this.logger.debug('  - Username:', userInfo.username);
      this.logger.debug('  - Email:', userInfo.email);
      this.logger.debug('  - Roles:', userInfo.roles);
      this.logger.debug('  - Is Admin:', userInfo.isAdmin);
    } catch (error) {
      this.logger.error('APP: Failed to load user info:', error);
      this.resetUserInfo();
    }
  }

  private resetUserInfo(): void {
    this.isLoggedIn = false;
    this.username = '';
    this.isAdmin = false;
  }

  async logout(): Promise<void> {
    this.logger.info(LOG_PREFIXES.APP, 'Logout');
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      this.logger.error('APP: Logout error:', error);
    }
  }
}
