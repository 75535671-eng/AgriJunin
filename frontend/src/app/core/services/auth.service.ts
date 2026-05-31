import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthStateService } from './auth-state.service';
import { ApiResponse, AuthData, Usuario } from '../../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly state = inject(AuthStateService);

  login(email: string, password: string) {
    return this.api.post<AuthData>('auth/login', { email, password }).pipe(
      tap((res) => this.state.setSession(res.data))
    );
  }

  register(data: { nombre: string; email: string; password: string; rol?: string }) {
    return this.api.post<AuthData>('auth/register', data).pipe(
      tap((res) => this.state.setSession(res.data))
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
