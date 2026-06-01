import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthStateService } from './auth-state.service';
import { ClimaSyncPromptService } from './clima-sync-prompt.service';
import { AuthData, Usuario } from '../../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly state = inject(AuthStateService);
  private readonly climaPrompt = inject(ClimaSyncPromptService);

  login(login: string, password: string) {
    const body = /^\d{8}$/.test(login.trim())
      ? { dni: login.trim(), password }
      : { email: login.trim(), password };
    return this.api.post<AuthData>('auth/login', body).pipe(
      tap((res) => {
        if (res.data.token) {
          this.state.setSession({ user: res.data.user, token: res.data.token });
          this.climaPrompt.markShowAfterLogin();
        }
      })
    );
  }

  register(data: {
    dni: string;
    nombres: string;
    apellidos: string;
    nombre: string;
    email: string;
    password: string;
    rol?: string;
  }) {
    return this.api.post<AuthData>('auth/register', data).pipe(
      tap((res) => {
        if (res.data.token && !res.data.pendienteAprobacion) {
          this.state.setSession(res.data as { user: typeof res.data.user; token: string });
          this.climaPrompt.markShowAfterLogin();
        }
      })
    );
  }

  loadProfile() {
    return this.api.get<Usuario>('auth/profile').pipe(
      tap((res) => {
        const token = this.state.token();
        if (token) this.state.setSession({ user: res.data, token });
      })
    );
  }
}
