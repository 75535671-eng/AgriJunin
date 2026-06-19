import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

/** Cierra sesión si el token expiró o es inválido (excepto en login/registro). */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const isAuthRoute = /\/auth\/(login|register)/.test(req.url);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthRoute && auth.isAuthenticated()) {
        auth.clearSession();
      }
      return throwError(() => err);
    })
  );
};
