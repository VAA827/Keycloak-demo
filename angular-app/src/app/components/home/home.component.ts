import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isLoggedIn: boolean = false;
  username: string = '';
  publicMessage: string = '';

  constructor(
    private readonly keycloak: KeycloakService,
    private readonly apiService: ApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadPublicMessage();
    await this.checkLoginStatus();
  }

  async checkLoginStatus(): Promise<void> {
    try {
      const loggedIn: boolean = await this.keycloak.isLoggedIn();
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        await this.loadUserInfo();
      } else {
        this.username = '';
      }
    } catch (error) {
      this.isLoggedIn = false;
      this.username = '';
      // Hibát naplózunk Sonar miatt
      // eslint-disable-next-line no-console
      console.error('Hiba a bejelentkezési állapot ellenőrzésekor:', error);
    }
  }

  async loadUserInfo(): Promise<void> {
    try {
      // Közvetlenül a tokenből olvassuk ki az adatokat (CORS probléma elkerülése)
      const keycloakInstance = this.keycloak.getKeycloakInstance();
      if (keycloakInstance.tokenParsed) {
        this.username = keycloakInstance.tokenParsed['preferred_username'] ||
          keycloakInstance.tokenParsed['name'] ||
          keycloakInstance.tokenParsed['sub'] ||
          'Felhasználó';
      } else {
        this.username = 'Token hiányzik';
      }
    } catch (error) {
      this.username = 'Hiba történt';
      // eslint-disable-next-line no-console
      console.error('Hiba a felhasználói adatok betöltésekor:', error);
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
          // eslint-disable-next-line no-console
          console.error('Hiba a publikus üzenet betöltésekor:', err);
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
      // eslint-disable-next-line no-console
      console.error('Bejelentkezési hiba:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.keycloak.logout(window.location.origin);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Kijelentkezési hiba:', error);
    }
  }
}
