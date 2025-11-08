import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot): Promise<boolean> => {
  const keycloak = inject(KeycloakService);
  const userService = inject(UserService);
  const router = inject(Router);

  const isLoggedIn = await userService.isLoggedIn();

  if (!isLoggedIn) {
    await keycloak.login({
      redirectUri: window.location.origin + window.location.pathname
    });
    return false;
  }

  // Role ellenőrzés
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles?.length > 0) {
    const hasRole = requiredRoles.some(role => userService.hasRole(role));
    if (!hasRole) {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};
