import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthData, Usuario } from '../../models';

const TOKEN_KEY = 'agri_token';
const USER_KEY = 'agri_user';

/**
 * Estado global de autenticación con Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly router = inject(Router);

  private readonly _user = signal<Usuario | null>(this.loadUser());
  private readonly _token = signal<string | null>(this.loadToken());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly userRole = computed(() => this._user()?.rol ?? null);
  readonly userName = computed(() => this._user()?.nombre ?? 'Usuario');

  readonly isAdmin = computed(() => this._user()?.rol === 'administrador');
  readonly isTecnico = computed(() => this._user()?.rol === 'tecnico');
  readonly canEdit = computed(() =>
    ['administrador', 'tecnico'].includes(this._user()?.rol ?? '')
  );

  constructor() {
    effect(() => {
      const token = this._token();
      const user = this._user();
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    });
  }

  setSession(data: AuthData): void {
    this._token.set(data.token);
    this._user.set(data.user);
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasRole(...roles: string[]): boolean {
    const rol = this._user()?.rol;
    return !!rol && roles.includes(rol);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
