import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertasStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-alerta-form',
  imports: [FormField, RouterLink, DatePipe],
  providers: [AlertasStore],
  templateUrl: './alerta-form.component.html',
  styleUrl: './alerta-form.component.scss',
})
export class AlertaFormComponent implements OnInit {
  private readonly store = inject(AlertasStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;
  private id?: number;

  private readonly alertaModel = signal({
    tipo: 'sistema',
    nivel: 'advertencia',
    registro_id: '',
    sensor_id: '',
    titulo: '',
    mensaje: '',
    leida: false,
    resuelta: false,
  });

  protected readonly alertaForm = form(this.alertaModel, (path) => {
    required(path.tipo, { message: 'Tipo requerido' });
    required(path.nivel, { message: 'Nivel requerido' });
    required(path.titulo, { message: 'Título requerido' });
    required(path.mensaje, { message: 'Mensaje requerido' });
    required(path.registro_id, {
      when: ({ valueOf }) =>
        ['humedad', 'temperatura', 'ph', 'pluvia', 'produccion'].includes(valueOf(path.tipo)),
      message: 'Seleccione un registro',
    });
    required(path.sensor_id, {
      when: ({ valueOf }) => valueOf(path.tipo) === 'sensor',
      message: 'Seleccione un sensor',
    });
  });

  ngOnInit(): void {
    this.lookup.loadRegistros();
    this.lookup.loadSensores();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const d = r.data;
        this.alertaModel.set({
          tipo: d.tipo,
          nivel: d.nivel,
          registro_id: d.registro_id != null ? String(d.registro_id) : '',
          sensor_id: d.sensor_id != null ? String(d.sensor_id) : '',
          titulo: d.titulo,
          mensaje: d.mensaje,
          leida: !!d.leida,
          resuelta: !!d.resuelta,
        });
      });
    }
  }

  needsRegistro(): boolean {
    const t = this.alertaModel().tipo;
    return ['humedad', 'temperatura', 'ph', 'pluvia', 'produccion'].includes(t || '');
  }

  needsSensor(): boolean {
    return this.alertaModel().tipo === 'sensor';
  }

  needsSistema(): boolean {
    return this.alertaModel().tipo === 'sistema';
  }

  save(): void {
    touchFields(
      this.alertaForm.tipo,
      this.alertaForm.nivel,
      this.alertaForm.titulo,
      this.alertaForm.mensaje,
      this.alertaForm.registro_id,
      this.alertaForm.sensor_id
    );
    if (this.alertaForm().invalid()) {
      return;
    }
    this.loading.set(true);
    const raw = this.alertaModel();
    const data: Record<string, unknown> = {
      tipo: raw.tipo,
      nivel: raw.nivel,
      titulo: raw.titulo,
      mensaje: raw.mensaje,
      leida: raw.leida ? 1 : 0,
      resuelta: raw.resuelta ? 1 : 0,
      registro_id: this.needsRegistro() ? Number(raw.registro_id) || null : null,
      sensor_id: this.needsSensor() ? Number(raw.sensor_id) || null : null,
    };
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data as never)
      : this.store.create(data as never);
    req.subscribe({
      next: () => this.router.navigate(['/alertas']),
      error: (e) => {
        this.error.set(e?.error?.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
