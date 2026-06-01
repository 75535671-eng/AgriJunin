import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertasStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-alerta-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  providers: [AlertasStore],
  template: `
    <h2>{{ isEdit() ? 'Editar' : 'Nueva' }} alerta</h2>
    @if (error()) { <p class="err">{{ error() }}</p> }
    <form [formGroup]="form" (ngSubmit)="save()" class="card" style="padding:1.5rem">
      <div class="form-grid">
        <div class="form-group">
          <label>Tipo *</label>
          <select formControlName="tipo">
            <option value="humedad">Humedad</option>
            <option value="temperatura">Temperatura</option>
            <option value="ph">pH</option>
            <option value="pluvia">Lluvia</option>
            <option value="sensor">Sensor</option>
            <option value="produccion">Producción</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nivel *</label>
          <select formControlName="nivel">
            <option value="info">Info</option>
            <option value="advertencia">Advertencia</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        @if (needsRegistro()) {
          <div class="form-group full">
            <label>Registro agrícola *</label>
            <select formControlName="registro_id">
              <option [ngValue]="null">— Seleccione —</option>
              @for (r of lookup.registros(); track r.id) {
                <option [ngValue]="r.id">#{{ r.id }} — {{ r.lote_nombre }} ({{ r.fecha_registro | date:'short' }})</option>
              }
            </select>
          </div>
        }

        @if (needsSensor()) {
          <div class="form-group full">
            <label>Sensor *</label>
            <select formControlName="sensor_id">
              <option [ngValue]="null">— Seleccione —</option>
              @for (s of lookup.sensores(); track s.id) {
                <option [ngValue]="s.id">{{ s.codigo_sensor }} — {{ s.nombre }} ({{ s.lote_nombre || 'lote' }})</option>
              }
            </select>
          </div>
        }

        @if (needsLote()) {
          <div class="form-group full">
            <label>Lote *</label>
            <select formControlName="lote_id">
              <option [ngValue]="null">— Seleccione —</option>
              @for (l of lookup.lotes(); track l.id) {
                <option [ngValue]="l.id">{{ l.codigo_lote }} — {{ l.nombre }}</option>
              }
            </select>
          </div>
        }

        <div class="form-group full"><label>Título *</label><input formControlName="titulo" /></div>
        <div class="form-group full"><label>Mensaje *</label><textarea formControlName="mensaje" rows="3"></textarea></div>
        <div class="form-group"><label><input type="checkbox" formControlName="leida" /> Leída</label></div>
        <div class="form-group"><label><input type="checkbox" formControlName="resuelta" /> Resuelta</label></div>
      </div>
      <div class="actions">
        <a routerLink="/alertas" class="btn btn--outline">Cancelar</a>
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
export class AlertaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AlertasStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private id?: number;

  form = this.fb.group({
    tipo: ['sistema', Validators.required],
    nivel: ['advertencia', Validators.required],
    registro_id: this.fb.control<number | null>(null),
    sensor_id: this.fb.control<number | null>(null),
    lote_id: this.fb.control<number | null>(null),
    titulo: ['', Validators.required],
    mensaje: ['', Validators.required],
    leida: [false],
    resuelta: [false],
  });

  ngOnInit(): void {
    this.lookup.loadRegistros();
    this.lookup.loadSensores();
    this.lookup.loadLotes({ soloAprobados: true });

    this.form.get('tipo')?.valueChanges.subscribe(() => this.syncOrigenValidators());

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const d = r.data;
        this.form.patchValue({
          tipo: d.tipo,
          nivel: d.nivel,
          registro_id: d.registro_id ?? null,
          sensor_id: d.sensor_id ?? null,
          lote_id: d.lote_id ?? null,
          titulo: d.titulo,
          mensaje: d.mensaje,
          leida: !!d.leida,
          resuelta: !!d.resuelta,
        });
        this.syncOrigenValidators();
      });
    } else {
      this.syncOrigenValidators();
    }
  }

  needsRegistro(): boolean {
    const t = this.form.get('tipo')?.value;
    return ['humedad', 'temperatura', 'ph', 'pluvia', 'produccion'].includes(t || '');
  }

  needsSensor(): boolean {
    return this.form.get('tipo')?.value === 'sensor';
  }

  needsLote(): boolean {
    return this.form.get('tipo')?.value === 'sistema';
  }

  private syncOrigenValidators(): void {
    const reg = this.form.get('registro_id')!;
    const sen = this.form.get('sensor_id')!;
    const lot = this.form.get('lote_id')!;

    reg.clearValidators();
    sen.clearValidators();
    lot.clearValidators();

    if (this.needsRegistro()) reg.setValidators(Validators.required);
    if (this.needsSensor()) sen.setValidators(Validators.required);
    if (this.needsLote()) lot.setValidators(Validators.required);

    reg.updateValueAndValidity();
    sen.updateValueAndValidity();
    lot.updateValueAndValidity();
  }

  save(): void {
    this.syncOrigenValidators();
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const tipo = raw.tipo || 'sistema';
    const data: Record<string, unknown> = {
      tipo,
      nivel: raw.nivel,
      titulo: raw.titulo,
      mensaje: raw.mensaje,
      leida: raw.leida ? 1 : 0,
      resuelta: raw.resuelta ? 1 : 0,
      registro_id: this.needsRegistro() ? raw.registro_id : null,
      sensor_id: this.needsSensor() ? raw.sensor_id : null,
      lote_id: this.needsLote() ? raw.lote_id : null,
    };
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, data as never)
      : this.store.create(data as never);
    req.subscribe({
      next: () => this.router.navigate(['/alertas']),
      error: (e) => { this.error.set(e?.error?.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }
}
