import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgricultoresStore } from '../../services/entity.service';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-agricultor-form',
  imports: [FormField, RouterLink],
  providers: [AgricultoresStore],
  templateUrl: './agricultor-form.component.html',
  styleUrls: ['./crud-list.scss', '../../shared/styles/form-layout.scss'],
})
export class AgricultorFormComponent implements OnInit {
  private readonly store = inject(AgricultoresStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly profileNombre = signal('');
  protected readonly profileDni = signal('');
  protected readonly profileEmail = signal('');
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;
  private id?: number;

  private readonly agricultorModel = signal({
    usuario_id: 1,
    telefono: '',
    direccion: '',
    distrito: 'Junín',
    provincia: 'Junín',
    departamento: 'Junín',
    hectareas_totales: 0,
    fecha_registro: new Date().toISOString().slice(0, 10),
    activo: true,
    notas: '',
  });

  protected readonly agricultorForm = form(this.agricultorModel, (path) => {
    required(path.usuario_id, { message: 'ID de usuario requerido' });
    min(path.usuario_id, 1, { message: 'ID de usuario inválido' });
    required(path.distrito, { message: 'Distrito requerido' });
    min(path.hectareas_totales, 0, { message: 'No puede ser negativo' });
    required(path.fecha_registro, { message: 'Fecha requerida' });
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +idParam;
      this.store.getById(this.id).subscribe({
        next: (res) => {
          const d = res.data;
          this.profileNombre.set(d.usuario_nombre || `${d.nombres || ''} ${d.apellidos || ''}`.trim());
          this.profileDni.set(d.dni || '');
          this.profileEmail.set(d.usuario_email || d.email_contacto || '');
          this.agricultorModel.set({
            usuario_id: d.usuario_id,
            telefono: d.telefono || '',
            direccion: d.direccion || '',
            distrito: d.distrito,
            provincia: d.provincia || 'Junín',
            departamento: d.departamento || 'Junín',
            hectareas_totales: d.hectareas_totales ?? 0,
            fecha_registro: String(d.fecha_registro).slice(0, 10),
            activo: !!d.activo,
            notas: d.notas || '',
          });
        },
      });
    }
  }

  submit(): void {
    touchFields(
      this.agricultorForm.usuario_id,
      this.agricultorForm.distrito,
      this.agricultorForm.hectareas_totales,
      this.agricultorForm.fecha_registro
    );
    if (this.agricultorForm().invalid()) {
      return;
    }
    this.loading.set(true);
    const data = this.agricultorModel();
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
}
