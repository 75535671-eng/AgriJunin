import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegistrosStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-registro-form',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [RegistrosStore],
  template: `
    <h2>{{ isEdit() ? 'Editar' : 'Nuevo' }} registro agrícola</h2>
    @if (error()) { <p class="err">{{ error() }}</p> }
    <form [formGroup]="form" (ngSubmit)="save()" class="card" style="padding:1.5rem">
      <div class="form-grid">
        <div class="form-group">
          <label>Lote *</label>
          <select formControlName="lote_id">
            @for (l of lookup.lotes(); track l.id) {
              <option [value]="l.id">{{ l.nombre }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Cultivo *</label>
          <select formControlName="cultivo_id">
            @for (c of lookup.cultivos(); track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>
        <div class="form-group"><label>Temperatura °C</label><input type="number" step="0.1" formControlName="temperatura" /></div>
        <div class="form-group"><label>Humedad suelo %</label><input type="number" step="0.1" formControlName="humedad_suelo" /></div>
        <div class="form-group"><label>Humedad aire %</label><input type="number" step="0.1" formControlName="humedad_aire" /></div>
        <div class="form-group"><label>pH suelo</label><input type="number" step="0.01" formControlName="ph_suelo" /></div>
        <div class="form-group"><label>Precipitación mm</label><input type="number" step="0.1" formControlName="precipitacion_mm" /></div>
        <div class="form-group"><label>Producción kg</label><input type="number" step="0.01" formControlName="produccion_kg" /></div>
        <div class="form-group full"><label>Observaciones</label><textarea formControlName="observaciones" rows="3"></textarea></div>
      </div>
      <div class="actions">
        <a routerLink="/registros" class="btn btn--outline">Cancelar</a>
        <button type="submit" class="btn btn--primary" [disabled]="loading()">Guardar</button>
      </div>
    </form>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .full { grid-column: 1 / -1; }
    .actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
    .err { color: var(--danger); }
  `],
})
export class RegistroFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(RegistrosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStateService);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private id?: number;

  form = this.fb.nonNullable.group({
    lote_id: [1, Validators.required],
    cultivo_id: [1, Validators.required],
    temperatura: [null as number | null],
    humedad_suelo: [null as number | null],
    humedad_aire: [null as number | null],
    ph_suelo: [null as number | null],
    precipitacion_mm: [0],
    produccion_kg: [null as number | null],
    observaciones: [''],
    registrado_por: [0],
  });

  ngOnInit(): void {
    this.lookup.loadLotes();
    this.lookup.loadCultivos();
    this.form.patchValue({ registrado_por: this.auth.user()?.id ?? 1 });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => this.form.patchValue(r.data as never));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const data = this.form.getRawValue() as Partial<import('../../models').RegistroAgricola>;
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data)
      : this.store.create(data);
    req.subscribe({
      next: () => this.router.navigate(['/registros']),
      error: (e) => { this.error.set(e?.error?.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }
}
