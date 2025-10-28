import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { KeycloakTokenService } from './services/keycloak-token.service';

function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    return keycloak.init({
      config: environment.keycloak,
      initOptions: {
        checkLoginIframe: false  // ← FONTOS: Kikapcsolva!
        // NEM használunk: onLoad, silentCheckSsoRedirectUri
      },
      enableBearerInterceptor: false
    }).catch((error) => {
      console.error('Keycloak initialization failed:', error);
      throw error;
    });
  };
}

function initializeTokenRefresh(tokenService: KeycloakTokenService, keycloak: KeycloakService) {
  return () => {
    const keycloakInstance = keycloak.getKeycloakInstance();
    if (keycloakInstance.authenticated) {
      tokenService.startTokenRefresh();
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    KeycloakService,
    KeycloakTokenService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTokenRefresh,
      multi: true,
      deps: [KeycloakTokenService, KeycloakService]
    }
  ]
};
