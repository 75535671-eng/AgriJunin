import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LotesStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-lote-form',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [LotesStore],
  template: `
    <h2>{{ isEdit() ? 'Editar' : 'Nuevo' }} lote</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card" style="padding:1.5rem">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
        <div class="form-group">
          <label>Agricultor *</label>
          <select formControlName="agricultor_id">
            @for (a of lookup.agricultores(); track a.id) {
              <option [value]="a.id">{{ a.nombres }} {{ a.apellidos }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Cultivo</label>
          <select formControlName="cultivo_id">
            <option value="">— Sin asignar —</option>
            @for (c of lookup.cultivos(); track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>
        <div class="form-group"><label>Código lote *</label><input formControlName="codigo_lote" /></div>
        <div class="form-group"><label>Nombre *</label><input formControlName="nombre" /></div>
        <div class="form-group"><label>Área (ha) *</label><input type="number" step="0.01" formControlName="area_hectareas" /></div>
        <div class="form-group"><label>Estado</label>
          <select formControlName="estado">
            <option value="preparacion">Preparación</option><option value="siembra">Siembra</option>
            <option value="crecimiento">Crecimiento</option><option value="cosecha">Cosecha</option>
            <option value="barbecho">Barbecho</option>
          </select>
        </div>
        <div class="form-group"><label>Ubicación</label><input formControlName="ubicacion" /></div>
      </div>
      <div style="margin-top:1rem;display:flex;gap:0.5rem">
        <a routerLink="/lotes" class="btn btn--outline">Cancelar</a>
        <button class="btn btn--primary" type="submit">Guardar</button>
      </div>
    </form>
  `,
})
export class LoteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(LotesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);
  protected readonly isEdit = signal(false);
  private id?: number;

  form = this.fb.nonNullable.group({
    agricultor_id: [1, Validators.required],
    cultivo_id: [undefined as number | undefined],
    codigo_lote: ['', Validators.required],
    nombre: ['', Validators.required],
    ubicacion: [''],
    area_hectareas: [1, [Validators.required, Validators.min(0.01)]],
    tipo_suelo: ['franco'],
    estado: ['preparacion'],
    activo: [true],
  });

  ngOnInit(): void {
    this.lookup.loadAgricultores();
    this.lookup.loadCultivos();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => this.form.patchValue(r.data as never));
    }
  }

  save(): void {
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, this.form.getRawValue())
      : this.store.create(this.form.getRawValue());
    req.subscribe(() => this.router.navigate(['/lotes']));
  }
}
