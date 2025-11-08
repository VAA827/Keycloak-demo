import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';
import { LoggerService } from '../../services/logger.service';
import { LOG_PREFIXES, DEFAULT_VALUES } from '../../constants/app.constants';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  username = '';
  publicMessage = '';

  constructor(
    private readonly keycloak: KeycloakService,
    private readonly apiService: ApiService,
    private readonly userService: UserService,
    private readonly logger: LoggerService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadPublicMessage();
    await this.checkLoginStatus();
  }

  async checkLoginStatus(): Promise<void> {
    try {
      this.isLoggedIn = await this.userService.isLoggedIn();
      if (this.isLoggedIn) {
        this.loadUserInfo();
      } else {
        this.username = '';
      }
    } catch (error) {
      this.logger.error('Hiba a bejelentkezési állapot ellenőrzésekor:', error);
      this.isLoggedIn = false;
      this.username = '';
    }
  }

  private loadUserInfo(): void {
    try {
      const userInfo = this.userService.getUserInfoFromToken();
      this.username = userInfo.username;
    } catch (error) {
      this.logger.error('Hiba a felhasználói adatok betöltésekor:', error);
      this.username = DEFAULT_VALUES.ERROR_USERNAME;
    }
  }

  async loadPublicMessage(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.apiService.getPublicMessage().subscribe({
        next: (data) => {
          this.publicMessage = data.message;
          resolve();
        },
        error: (err) => {
          this.publicMessage = 'Nem sikerült betölteni az üzenetet';
          this.logger.error('Hiba a publikus üzenet betöltésekor:', err);
          resolve();
        }
      });
    });
  }

  async login(): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: window.location.origin
      });
    } catch (error) {
      this.logger.error('Bejelentkezési hiba:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      this.logger.error('Kijelentkezési hiba:', error);
    }
  }
}
