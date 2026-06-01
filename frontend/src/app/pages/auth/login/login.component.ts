import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    login: ['', [Validators.required, this.loginValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loginValidator(control: { value: string }) {
    const v = String(control.value || '').trim();
    if (!v) return { required: true };
    if (/^\d{8}$/.test(v)) return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    return { loginFormat: true };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { login, password } = this.form.getRawValue();
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

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
