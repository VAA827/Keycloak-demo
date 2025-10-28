import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);

  // Csak API hívásokhoz adjuk hozzá a tokent (kivéve publikus)
  if (req.url.includes('/api/') && !req.url.includes('/api/public/')) {
    try {
      const keycloakInstance = keycloak.getKeycloakInstance();
      const token = keycloakInstance.token;

      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        console.warn('Auth interceptor: No token available for protected endpoint:', req.url);
      }
    } catch (error) {
      console.error('Auth interceptor: Error getting token:', error);
    }
  }

  return next(req);
};
