import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DniService } from '../../../core/services/dni.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly dniApi = inject(DniService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly loadingDni = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dniOk = signal(false);
  protected readonly successMsg = signal<string | null>(null);

  protected readonly esTecnico = () => this.form.controls.rol.value === 'tecnico';

  onRolChange(): void {
    this.successMsg.set(null);
  }

  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    nombres: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    apellidos: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
    confirmPassword: ['', Validators.required],
    rol: ['agricultor' as 'agricultor' | 'tecnico'],
  }, { validators: this.passwordMatch });

  passwordStrength(control: AbstractControl) {
    const v = control.value as string;
    if (!v) return null;
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v);
    return ok ? null : { strength: true };
  }

  passwordMatch(group: AbstractControl) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p === c ? null : { mismatch: true };
  }

  onDniInput(): void {
    this.dniOk.set(false);
    this.form.controls.nombres.disable();
    this.form.controls.apellidos.disable();
    this.form.patchValue({ nombres: '', apellidos: '' });
  }

  buscarDni(): void {
    const dni = this.form.controls.dni.value.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.form.controls.dni.markAsTouched();
      return;
    }
    this.loadingDni.set(true);
    this.error.set(null);
    this.dniApi.consultar(dni).subscribe({
      next: (res) => {
        this.form.controls.nombres.enable();
        this.form.controls.apellidos.enable();
        this.form.patchValue({
          nombres: res.data.nombres,
          apellidos: res.data.apellidos,
        });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const raw = this.form.getRawValue();
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

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
