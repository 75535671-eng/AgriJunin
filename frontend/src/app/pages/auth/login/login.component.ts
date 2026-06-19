import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { firstFieldError, showFieldError, touchFields } from '../../../shared/utils/form-signals';

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;

  private readonly loginModel = signal({ login: '', password: '' });

  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.login, { message: 'Ingrese su DNI o correo' });
    validate(path.login, ({ value }) => {
      const v = String(value() ?? '').trim();
      if (/^\d{8}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return null;
      }
      return { kind: 'loginFormat', message: 'Ingrese DNI (8 dígitos) o correo válido' };
    });
    required(path.password, { message: 'Contraseña requerida' });
    minLength(path.password, 6, { message: 'Mínimo 6 caracteres' });
  });

  ngOnInit(): void {
    this.authState.clearSession();
    this.restoreFromBrokenUrl();
  }

  /** Recupera credenciales si el formulario se envió por GET (URL con ?ng.form0.login=...) */
  private restoreFromBrokenUrl(): void {
    if (typeof window === 'undefined' || !window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    const login = params.get('ng.form0.login') ?? params.get('login') ?? '';
    const password = params.get('ng.form0.password') ?? params.get('password') ?? '';
    if (!login) return;
    this.loginModel.set({ login, password });
    void this.router.navigate(['/auth/login'], { replaceUrl: true }).then(() => {
      if (password) this.submit();
    });
  }

  submit(event?: Event): void {
    event?.preventDefault();
    touchFields(this.loginForm.login, this.loginForm.password);
    if (this.loginForm().invalid()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { login, password } = this.loginModel();
    this.auth.login(login.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err?.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Intente de nuevo en unos segundos.');
        } else if (err?.status === 403) {
          this.error.set(err?.error?.message || 'Cuenta pendiente de aprobación');
        } else {
          this.error.set(err?.error?.message || err?.message || 'Credenciales inválidas');
        }
        this.loading.set(false);
      },
    });
  }
}
