import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegistrosStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RegistroAgricola } from '../../models';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-registro-form',
  imports: [FormField, RouterLink],
  providers: [RegistrosStore],
  templateUrl: './registro-form.component.html',
  styleUrl: './registro-form.component.scss',
})
export class RegistroFormComponent implements OnInit {
  private readonly store = inject(RegistrosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStateService);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;
  private id?: number;

  private readonly registroModel = signal({
    lote_id: '1',
    temperatura: null as number | null,
    humedad_suelo: null as number | null,
    humedad_aire: null as number | null,
    ph_suelo: null as number | null,
    precipitacion_mm: 0,
    produccion_kg: null as number | null,
    observaciones: '',
    registrado_por: 0,
  });

  protected readonly registroForm = form(this.registroModel, (path) => {
    required(path.lote_id, { message: 'Seleccione un lote' });
  });

  ngOnInit(): void {
    this.lookup.loadLotes({ soloAprobados: true });
    this.registroModel.update((m) => ({ ...m, registrado_por: this.auth.user()?.id ?? 1 }));
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const { cultivo_id: _, cultivo_nombre: __, ...rest } = r.data as RegistroAgricola;
        this.registroModel.set({
          lote_id: String(rest.lote_id),
          temperatura: rest.temperatura ?? null,
          humedad_suelo: rest.humedad_suelo ?? null,
          humedad_aire: rest.humedad_aire ?? null,
          ph_suelo: rest.ph_suelo ?? null,
          precipitacion_mm: rest.precipitacion_mm ?? 0,
          produccion_kg: rest.produccion_kg ?? null,
          observaciones: rest.observaciones || '',
          registrado_por: rest.registrado_por ?? this.auth.user()?.id ?? 1,
        });
      });
    }
  }

  save(): void {
    touchFields(this.registroForm.lote_id);
    if (this.registroForm().invalid()) {
      return;
    }
    this.loading.set(true);
    const raw = this.registroModel();
    const data = { ...raw, lote_id: Number(raw.lote_id) } as Partial<RegistroAgricola>;
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data)
      : this.store.create(data);
    req.subscribe({
      next: () => this.router.navigate(['/registros']),
      error: (e) => {
        this.error.set(e?.error?.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
