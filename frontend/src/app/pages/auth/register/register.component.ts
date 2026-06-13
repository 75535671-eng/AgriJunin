import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  readonly,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DniService } from '../../../core/services/dni.service';
import { firstFieldError, showFieldError, touchFields } from '../../../shared/utils/form-signals';

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly dniApi = inject(DniService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly loadingDni = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dniOk = signal(false);
  protected readonly successMsg = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;

  private readonly registerModel = signal({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'agricultor' as 'agricultor' | 'tecnico',
  });

  protected readonly registerForm = form(this.registerModel, (path) => {
    required(path.dni, { message: 'DNI requerido' });
    pattern(path.dni, /^\d{8}$/, { message: 'Ingrese un DNI válido de 8 dígitos' });
    maxLength(path.dni, 8);
    required(path.nombres, { message: 'Nombres requeridos' });
    minLength(path.nombres, 2, { message: 'Mínimo 2 caracteres' });
    required(path.apellidos, { message: 'Apellidos requeridos' });
    minLength(path.apellidos, 2, { message: 'Mínimo 2 caracteres' });
    readonly(path.nombres, () => !this.dniOk());
    readonly(path.apellidos, () => !this.dniOk());
    required(path.email, { message: 'Correo requerido' });
    email(path.email, { message: 'Correo inválido' });
    required(path.password, { message: 'Contraseña requerida' });
    minLength(path.password, 8, { message: 'Mínimo 8 caracteres' });
    validate(path.password, ({ value }) => {
      const v = String(value() ?? '');
      if (!v) {
        return undefined;
      }
      const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v);
      return ok
        ? undefined
        : { kind: 'strength', message: 'Debe incluir mayúscula, minúscula y número' };
    });
    required(path.confirmPassword, { message: 'Confirme la contraseña' });
    validate(path.confirmPassword, ({ value, valueOf }) => {
      const confirm = String(value() ?? '');
      if (!confirm) {
        return undefined;
      }
      return valueOf(path.password) === confirm
        ? undefined
        : { kind: 'mismatch', message: 'Las contraseñas no coinciden' };
    });
  });

  protected readonly esTecnico = () => this.registerModel().rol === 'tecnico';

  onRolChange(): void {
    this.successMsg.set(null);
  }

  onDniInput(): void {
    this.dniOk.set(false);
    this.registerModel.update((m) => ({ ...m, nombres: '', apellidos: '' }));
  }

  buscarDni(): void {
    const dni = this.registerModel().dni.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.registerForm.dni().markAsTouched();
      return;
    }
    this.loadingDni.set(true);
    this.error.set(null);
    this.dniApi.consultar(dni).subscribe({
      next: (res) => {
        this.registerModel.update((m) => ({
          ...m,
          nombres: res.data.nombres,
          apellidos: res.data.apellidos,
        }));
        this.dniOk.set(true);
        this.loadingDni.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se encontró el DNI');
        this.dniOk.set(false);
        this.loadingDni.set(false);
      },
    });
  }

  submit(): void {
    if (!this.dniOk()) {
      this.error.set('Consulte su DNI con RENIEC antes de registrarse');
      return;
    }
    touchFields(
      this.registerForm.dni,
      this.registerForm.nombres,
      this.registerForm.apellidos,
      this.registerForm.email,
      this.registerForm.password,
      this.registerForm.confirmPassword
    );
    if (this.registerForm().invalid()) {
      return;
    }
    this.loading.set(true);
    const raw = this.registerModel();
    const nombre = `${raw.nombres} ${raw.apellidos}`.trim();
    this.auth
      .register({
        dni: raw.dni,
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        nombre,
        email: raw.email,
        password: raw.password,
        rol: raw.rol,
      })
      .subscribe({
        next: (res) => {
          if (res.data.pendienteAprobacion) {
            this.successMsg.set(
              res.message ||
                'Solicitud enviada. Un administrador revisará su cuenta. Podrá iniciar sesión cuando sea aprobada.'
            );
            this.error.set(null);
            this.loading.set(false);
            return;
          }
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Error al registrarse');
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }
}
