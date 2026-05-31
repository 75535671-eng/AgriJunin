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
        <div class="form-group full">
          <label>Registro agrícola *</label>
          <select formControlName="registro_id">
            @for (r of lookup.registros(); track r.id) {
              <option [value]="r.id">#{{ r.id }} — {{ r.lote_nombre }} ({{ r.fecha_registro | date:'short' }})</option>
            }
          </select>
        </div>
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

  form = this.fb.nonNullable.group({
    registro_id: [1, Validators.required],
    tipo: ['sistema', Validators.required],
    nivel: ['advertencia', Validators.required],
    titulo: ['', Validators.required],
    mensaje: ['', Validators.required],
    leida: [false],
    resuelta: [false],
  });

  ngOnInit(): void {
    this.lookup.loadRegistros();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const d = r.data;
        this.form.patchValue({
          ...d,
          leida: !!d.leida,
          resuelta: !!d.resuelta,
        } as never);
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const data = {
      ...raw,
      leida: raw.leida ? 1 : 0,
      resuelta: raw.resuelta ? 1 : 0,
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
