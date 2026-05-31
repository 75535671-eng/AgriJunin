import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CultivosStore } from '../../services/entity.service';

@Component({
  selector: 'app-cultivo-form',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [CultivosStore],
  template: `
    <h2>{{ isEdit() ? 'Editar' : 'Nuevo' }} cultivo</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="card form-card" style="padding:1.5rem">
      <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
        <div class="form-group"><label>Nombre *</label><input formControlName="nombre" /></div>
        <div class="form-group"><label>Nombre científico</label><input formControlName="nombre_cientifico" /></div>
        <div class="form-group"><label>Tipo *</label>
          <select formControlName="tipo">
            <option value="cereal">Cereal</option><option value="tuberculo">Tubérculo</option>
            <option value="hortaliza">Hortaliza</option><option value="fruta">Fruta</option>
            <option value="legumbre">Legumbre</option><option value="forraje">Forraje</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div class="form-group"><label>Temporada</label>
          <select formControlName="temporada"><option value="verano">Verano</option><option value="invierno">Invierno</option><option value="todo_año">Todo el año</option></select>
        </div>
        <div class="form-group"><label>Días crecimiento</label><input type="number" formControlName="dias_crecimiento" /></div>
        <div class="form-group"><label>Rendimiento (qq/ha)</label><input type="number" formControlName="rendimiento_promedio" /></div>
      </div>
      <div style="margin-top:1rem;display:flex;gap:0.5rem">
        <a routerLink="/cultivos" class="btn btn--outline">Cancelar</a>
        <button type="submit" class="btn btn--primary">Guardar</button>
      </div>
    </form>
  `,
})
export class CultivoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CultivosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly isEdit = signal(false);
  private id?: number;

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    nombre_cientifico: [''],
    tipo: ['tuberculo', Validators.required],
    temporada: ['todo_año'],
    dias_crecimiento: [90, [Validators.min(1), Validators.max(365)]],
    rendimiento_promedio: [0],
    activo: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => this.form.patchValue(r.data as never));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const req = this.isEdit() && this.id
      ? this.store.update(this.id, this.form.getRawValue())
      : this.store.create(this.form.getRawValue());
    req.subscribe(() => this.router.navigate(['/cultivos']));
  }
}
