import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgricultoresStore } from '../../services/entity.service';

@Component({
  selector: 'app-agricultor-form',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [AgricultoresStore],
  templateUrl: './agricultor-form.component.html',
  styleUrl: './crud-list.scss',
})
export class AgricultorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AgricultoresStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private id?: number;

  form = this.fb.nonNullable.group({
    usuario_id: [1, [Validators.required, Validators.min(1)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    telefono: [''],
    email_contacto: ['', Validators.email],
    direccion: [''],
    distrito: ['Junín', Validators.required],
    provincia: ['Junín'],
    departamento: ['Junín'],
    hectareas_totales: [0, [Validators.min(0)]],
    fecha_registro: [new Date().toISOString().slice(0, 10), Validators.required],
    activo: [true],
    notas: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +idParam;
      this.store.getById(this.id).subscribe({
        next: (res) => {
          const d = res.data;
          this.form.patchValue({
            ...d,
            fecha_registro: String(d.fecha_registro).slice(0, 10),
            activo: !!d.activo,
          });
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const data = this.form.getRawValue();
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data)
      : this.store.create(data);

    req.subscribe({
      next: () => this.router.navigate(['/agricultores']),
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar');
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
