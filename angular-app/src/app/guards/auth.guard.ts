import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const isLoggedIn = await keycloak.isLoggedIn();

  if (!isLoggedIn) {
    await keycloak.login({
      redirectUri: window.location.origin + window.location.pathname
    });
    return false;
  }

  // Role ellenőrzés
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => keycloak.isUserInRole(role));
    if (!hasRole) {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};
