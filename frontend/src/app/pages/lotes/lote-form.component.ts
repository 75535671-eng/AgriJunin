import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-lote-form',
  imports: [ReactiveFormsModule, RouterLink, RelationBannerComponent, LoteMapPickerComponent],
  providers: [LotesStore],
  templateUrl: './lote-form.component.html',
  styleUrl: './lote-form.component.scss',
})
export class LoteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(LotesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthService);
  protected readonly lookup = inject(LookupService);
  protected readonly auth = inject(AuthStateService);

  protected readonly isEdit = signal(false);
  protected readonly agricultorId = computed(() => this.auth.user()?.agricultor_id ?? null);
  private id?: number;

  form = this.fb.nonNullable.group({
    agricultor_id: [1, Validators.required],
    cultivo_id: ['', Validators.required],
    codigo_lote: ['', Validators.required],
    nombre: ['', Validators.required],
    ubicacion: [''],
    latitud: [null as number | null],
    longitud: [null as number | null],
    area_hectareas: [1, [Validators.required, Validators.min(0.01)]],
    tipo_suelo: ['franco'],
    estado: ['preparacion'],
    activo: [true],
  });

  ngOnInit(): void {
    this.lookup.loadCultivos();
    if (!this.auth.isAgricultor()) {
      this.lookup.loadAgricultores();
    } else {
      this.form.controls.agricultor_id.clearValidators();
      this.form.controls.agricultor_id.updateValueAndValidity();
      const agId = this.auth.user()?.agricultor_id;
      if (agId) {
        this.form.patchValue({ agricultor_id: agId });
      } else {
        this.authApi.loadProfile().subscribe((r) => {
          if (r.data.agricultor_id) {
            this.form.patchValue({ agricultor_id: r.data.agricultor_id });
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
        this.form.patchValue({
          ...data,
          cultivo_id: data.cultivo_id != null ? String(data.cultivo_id) : '',
          latitud: data.latitud ?? null,
          longitud: data.longitud ?? null,
        } as never);
      });
    }
  }

  onUbicacion(u: LoteUbicacion): void {
    this.form.patchValue({
      latitud: u.latitud,
      longitud: u.longitud,
      ubicacion: u.ubicacion,
    });
  }

  save(): void {
    const raw = this.form.getRawValue();
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
