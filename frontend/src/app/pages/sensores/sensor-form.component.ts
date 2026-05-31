import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SensoresStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-sensor-form',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [SensoresStore],
  template: `
    <h2>{{ isEdit() ? 'Editar' : 'Nuevo' }} sensor</h2>
    @if (error()) { <p class="err">{{ error() }}</p> }
    <form [formGroup]="form" (ngSubmit)="save()" class="card" style="padding:1.5rem">
      <div class="form-grid">
        <div class="form-group">
          <label>Lote *</label>
          <select formControlName="lote_id">
            @for (l of lookup.lotes(); track l.id) {
              <option [value]="l.id">{{ l.codigo_lote }} — {{ l.nombre }}</option>
            }
          </select>
        </div>
        <div class="form-group"><label>Código *</label><input formControlName="codigo_sensor" /></div>
        <div class="form-group"><label>Nombre *</label><input formControlName="nombre" /></div>
        <div class="form-group">
          <label>Tipo *</label>
          <select formControlName="tipo">
            <option value="humedad_suelo">Humedad suelo</option>
            <option value="temperatura">Temperatura</option>
            <option value="humedad_aire">Humedad aire</option>
            <option value="ph">pH</option>
            <option value="luz">Luz</option>
            <option value="pluviometro">Pluviómetro</option>
            <option value="multiparametro">Multiparamétrico</option>
          </select>
        </div>
        <div class="form-group"><label>Unidad *</label><input formControlName="unidad_medida" /></div>
        <div class="form-group"><label>Estado</label>
          <select formControlName="estado">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="falla">Falla</option>
          </select>
        </div>
        <div class="form-group"><label>Batería %</label><input type="number" formControlName="bateria_pct" min="0" max="100" /></div>
      </div>
      <div class="actions">
        <a routerLink="/sensores" class="btn btn--outline">Cancelar</a>
        <button type="submit" class="btn btn--primary" [disabled]="loading()">Guardar</button>
      </div>
    </form>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
    .err { color: var(--danger); margin-bottom: 1rem; }
  `],
})
export class SensorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(SensoresStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private id?: number;

  form = this.fb.nonNullable.group({
    lote_id: [1, Validators.required],
    codigo_sensor: ['', Validators.required],
    nombre: ['', Validators.required],
    tipo: ['humedad_suelo', Validators.required],
    unidad_medida: ['%', Validators.required],
    estado: ['activo'],
    bateria_pct: [100],
    activo: [true],
  });

  ngOnInit(): void {
    this.lookup.loadLotes();
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
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, this.form.getRawValue())
      : this.store.create(this.form.getRawValue());
    req.subscribe({
      next: () => this.router.navigate(['/sensores']),
      error: (e) => { this.error.set(e?.error?.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }
}
