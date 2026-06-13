import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { firstFieldError, showFieldError, touchFields } from '../../../shared/utils/form-signals';

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
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

  submit(): void {
    touchFields(this.loginForm.login, this.loginForm.password);
    if (this.loginForm().invalid()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { login, password } = this.loginModel();
    this.auth.login(login.trim(), password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        if (err?.status === 0) {
          this.error.set(
            'No se pudo conectar con el servidor. Inicie el backend (puerto 3000).'
          );
        } else {
          this.error.set(err?.error?.message || 'Credenciales inválidas');
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
