import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SensoresStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-sensor-form',
  imports: [FormField, RouterLink],
  providers: [SensoresStore],
  templateUrl: './sensor-form.component.html',
  styleUrl: './sensor-form.component.scss',
})
export class SensorFormComponent implements OnInit {
  private readonly store = inject(SensoresStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;
  private id?: number;

  private readonly sensorModel = signal({
    lote_id: '1',
    codigo_sensor: '',
    nombre: '',
    tipo: 'humedad_suelo',
    unidad_medida: '%',
    estado: 'activo',
    bateria_pct: 100,
    activo: true,
  });

  protected readonly sensorForm = form(this.sensorModel, (path) => {
    required(path.lote_id, { message: 'Seleccione un lote' });
    required(path.codigo_sensor, { message: 'Código requerido' });
    required(path.nombre, { message: 'Nombre requerido' });
    required(path.tipo, { message: 'Tipo requerido' });
    required(path.unidad_medida, { message: 'Unidad requerida' });
  });

  ngOnInit(): void {
    this.lookup.loadLotes();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        this.sensorModel.set({
          lote_id: String(r.data.lote_id),
          codigo_sensor: r.data.codigo_sensor,
          nombre: r.data.nombre,
          tipo: r.data.tipo,
          unidad_medida: r.data.unidad_medida,
          estado: r.data.estado || 'activo',
          bateria_pct: r.data.bateria_pct ?? 100,
          activo: !!r.data.activo,
        });
      });
    }
  }

  save(): void {
    touchFields(
      this.sensorForm.lote_id,
      this.sensorForm.codigo_sensor,
      this.sensorForm.nombre,
      this.sensorForm.tipo,
      this.sensorForm.unidad_medida
    );
    if (this.sensorForm().invalid()) {
      return;
    }
    this.loading.set(true);
    const data = { ...this.sensorModel(), lote_id: Number(this.sensorModel().lote_id) };
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data)
      : this.store.create(data);
    req.subscribe({
      next: () => this.router.navigate(['/sensores']),
      error: (e) => {
        this.error.set(e?.error?.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
