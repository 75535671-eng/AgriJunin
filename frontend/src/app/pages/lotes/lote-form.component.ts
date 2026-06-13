import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LotesStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import {
  LoteMapPickerComponent,
  LoteUbicacion,
} from '../../shared/components/lote-map-picker/lote-map-picker.component';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-lote-form',
  imports: [FormField, RouterLink, RelationBannerComponent, LoteMapPickerComponent],
  providers: [LotesStore],
  templateUrl: './lote-form.component.html',
  styleUrl: './lote-form.component.scss',
})
export class LoteFormComponent implements OnInit {
  private readonly store = inject(LotesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthService);
  protected readonly lookup = inject(LookupService);
  protected readonly auth = inject(AuthStateService);

  protected readonly isEdit = signal(false);
  protected readonly agricultorId = computed(() => this.auth.user()?.agricultor_id ?? null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;
  private id?: number;

  protected readonly loteModel = signal({
    agricultor_id: '1',
    cultivo_id: '',
    codigo_lote: '',
    nombre: '',
    ubicacion: '',
    latitud: null as number | null,
    longitud: null as number | null,
    area_hectareas: 1,
    tipo_suelo: 'franco',
    estado: 'preparacion',
    activo: true,
  });

  protected readonly loteForm = form(this.loteModel, (path) => {
    required(path.agricultor_id, {
      when: () => !this.auth.isAgricultor(),
      message: 'Seleccione un agricultor',
    });
    required(path.cultivo_id, { message: 'Seleccione un cultivo' });
    required(path.codigo_lote, { message: 'Código requerido' });
    required(path.nombre, { message: 'Nombre requerido' });
    required(path.area_hectareas, { message: 'Área requerida' });
    min(path.area_hectareas, 0.01, { message: 'Mínimo 0.01 ha' });
  });

  ngOnInit(): void {
    this.lookup.loadCultivos();
    if (!this.auth.isAgricultor()) {
      this.lookup.loadAgricultores();
    } else {
      const agId = this.auth.user()?.agricultor_id;
      if (agId) {
        this.loteModel.update((m) => ({ ...m, agricultor_id: String(agId) }));
      } else {
        this.authApi.loadProfile().subscribe((r) => {
          if (r.data.agricultor_id) {
            this.loteModel.update((m) => ({ ...m, agricultor_id: String(r.data.agricultor_id!) }));
          }
        });
      }
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const data = r.data;
        this.loteModel.set({
          agricultor_id: String(data.agricultor_id),
          cultivo_id: data.cultivo_id != null ? String(data.cultivo_id) : '',
          codigo_lote: data.codigo_lote,
          nombre: data.nombre,
          ubicacion: data.ubicacion || '',
          latitud: data.latitud ?? null,
          longitud: data.longitud ?? null,
          area_hectareas: data.area_hectareas ?? 1,
          tipo_suelo: data.tipo_suelo || 'franco',
          estado: data.estado || 'preparacion',
          activo: !!data.activo,
        });
      });
    }
  }

  onUbicacion(u: LoteUbicacion): void {
    this.loteModel.update((m) => ({
      ...m,
      latitud: u.latitud,
      longitud: u.longitud,
      ubicacion: u.ubicacion,
    }));
  }

  save(): void {
    touchFields(
      this.loteForm.agricultor_id,
      this.loteForm.cultivo_id,
      this.loteForm.codigo_lote,
      this.loteForm.nombre,
      this.loteForm.area_hectareas
    );
    if (this.loteForm().invalid()) {
      return;
    }
    const raw = this.loteModel();
    const body = {
      ...raw,
      cultivo_id: Number(raw.cultivo_id),
      agricultor_id: this.auth.isAgricultor()
        ? (this.agricultorId() ?? Number(raw.agricultor_id))
        : Number(raw.agricultor_id),
      latitud: raw.latitud ?? undefined,
      longitud: raw.longitud ?? undefined,
    };
    const req =
      this.isEdit() && this.id ? this.store.update(this.id, body) : this.store.create(body);
    req.subscribe({
      next: (res) => {
        alert(res.message || 'Guardado');
        this.router.navigate(['/lotes']);
      },
      error: (err) => alert(err?.error?.message || 'Error al guardar'),
    });
  }
}
