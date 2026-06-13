import { Routes } from '@angular/router';
import { APP_FEATURE_ROUTES } from './features/app/app.routes';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth', children: AUTH_ROUTES },
  ...APP_FEATURE_ROUTES,
  { path: '**', redirectTo: 'dashboard' },
];
