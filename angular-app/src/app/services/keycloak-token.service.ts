import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class KeycloakTokenService {
  private refreshInterval: any;
  private readonly MIN_TOKEN_VALIDITY = 30; // Token lejárat előtt 30 másodperccel frissítünk

  constructor(private keycloak: KeycloakService) {}

  /**
   * Elindítja az automatikus token frissítést
   * A token automatikusan frissül, ha 30 másodpercen belül lejár
   */
  startTokenRefresh(): void {
    // Ellenőrizzük a tokent minden 10 másodpercben
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 10000);

    // Azonnal is ellenőrizzük
    this.checkAndRefreshToken();
  }

  /**
   * Megállítja az automatikus token frissítést
   */
  stopTokenRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Ellenőrzi és frissíti a tokent, ha szükséges
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const keycloakInstance = this.keycloak.getKeycloakInstance();

      if (!keycloakInstance.authenticated) {
        return;
      }

      // Frissítjük a tokent, ha 30 másodpercen belül lejár
      const refreshed = await keycloakInstance.updateToken(this.MIN_TOKEN_VALIDITY);

      if (refreshed) {
        console.info('Token successfully refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Ha a token frissítés sikertelen, kijelentkeztetjük a felhasználót
      await this.keycloak.logout();
    }
  }

  /**
   * Manuális token frissítés
   * @returns Promise<boolean> - true, ha a token frissült
   */
  async refreshToken(): Promise<boolean> {
    try {
      const keycloakInstance = this.keycloak.getKeycloakInstance();
      return await keycloakInstance.updateToken(this.MIN_TOKEN_VALIDITY);
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Visszaadja az aktuális token lejárati idejét másodpercben
   */
  getTokenExpirationTime(): number | undefined {
    const keycloakInstance = this.keycloak.getKeycloakInstance();
    return keycloakInstance.tokenParsed?.exp;
  }

  /**
   * Ellenőrzi, hogy a token hamarosan lejár-e
   */
  isTokenExpiringSoon(seconds: number = 30): boolean {
    const keycloakInstance = this.keycloak.getKeycloakInstance();
    return keycloakInstance.isTokenExpired(seconds);
  }
}
