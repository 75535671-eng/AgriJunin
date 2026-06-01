import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/dashboard']);
};

export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.hasRole(...roles)) return true;
  return router.createUrlTree(['/dashboard']);
};

/** Bloquea rutas a roles no listados (p. ej. agricultores en /agricultores). */
export const denyRolesGuard = (...denied: string[]): CanActivateFn => () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  const rol = auth.userRole();
  if (!rol || !denied.includes(rol)) return true;
  return router.createUrlTree(['/dashboard']);
};
