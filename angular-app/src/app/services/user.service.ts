import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { UserInfo, TokenClaims } from '../models/user.model';
import { TOKEN_CLAIMS, ROLES, DEFAULT_VALUES } from '../constants/app.constants';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private keycloak: KeycloakService,
    private logger: LoggerService
  ) {}

  /**
   * Extracts user information from Keycloak token
   * This method consolidates the duplicated token parsing logic
   * that was previously in AppComponent, HomeComponent, and ProfileComponent
   */
  getUserInfoFromToken(): UserInfo {
    try {
      const keycloakInstance = this.keycloak.getKeycloakInstance();

      if (!keycloakInstance.tokenParsed) {
        this.logger.warn('No token available');
        return this.getDefaultUserInfo();
      }

      const token = keycloakInstance.tokenParsed as TokenClaims;

      const username = this.extractUsername(token);
      const email = token[TOKEN_CLAIMS.EMAIL] || DEFAULT_VALUES.FALLBACK_EMAIL;
      const roles = this.extractRoles(token);
      const isAdmin = this.checkAdminRole(roles);

      const userInfo: UserInfo = {
        username,
        email,
        name: token[TOKEN_CLAIMS.NAME],
        roles,
        isAdmin
      };

      this.logger.debug('User info extracted from token:', userInfo);

      return userInfo;

    } catch (error) {
      this.logger.error('Error extracting user info from token:', error);
      return this.getDefaultUserInfo();
    }
  }

  /**
   * Checks if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.keycloak.isLoggedIn();
    } catch (error) {
      this.logger.error('Error checking login status:', error);
      return false;
    }
  }

  /**
   * Checks if user has admin role
   */
  isAdmin(): boolean {
    return this.keycloak.isUserInRole(ROLES.ADMIN);
  }

  /**
   * Checks if user has specific role
   */
  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }

  /**
   * Gets user roles from token
   */
  getUserRoles(): string[] {
    const keycloakInstance = this.keycloak.getKeycloakInstance();
    const token = keycloakInstance.tokenParsed as TokenClaims;
    return this.extractRoles(token);
  }

  /**
   * Extracts username from token with fallback logic
   */
  private extractUsername(token: TokenClaims): string {
    return (
      token[TOKEN_CLAIMS.USERNAME] ||
      token[TOKEN_CLAIMS.NAME] ||
      token[TOKEN_CLAIMS.EMAIL] ||
      token[TOKEN_CLAIMS.SUB] ||
      DEFAULT_VALUES.FALLBACK_USERNAME
    );
  }

  /**
   * Extracts roles from token
   */
  private extractRoles(token: TokenClaims): string[] {
    const realmAccess = token[TOKEN_CLAIMS.REALM_ACCESS];
    return realmAccess?.[TOKEN_CLAIMS.ROLES] || [];
  }

  /**
   * Checks if ADMIN role exists in roles array
   */
  private checkAdminRole(roles: string[]): boolean {
    return roles.includes(ROLES.ADMIN);
  }

  /**
   * Returns default user info for error cases
   */
  private getDefaultUserInfo(): UserInfo {
    return {
      username: DEFAULT_VALUES.FALLBACK_USERNAME,
      email: DEFAULT_VALUES.FALLBACK_EMAIL,
      roles: [],
      isAdmin: false
    };
  }
}