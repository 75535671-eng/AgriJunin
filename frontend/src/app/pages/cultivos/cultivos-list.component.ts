import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CultivosStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-cultivos-list',
  imports: [PageHeaderComponent, RouterLink, FormsModule],
  providers: [CultivosStore],
  template: `
    <app-page-header title="Cultivos" subtitle="Catálogo de cultivos de la región"
      [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/cultivos/nuevo'])" />
    <div class="toolbar card">
      <input type="search" placeholder="Buscar cultivo..." [ngModel]="search()" (ngModelChange)="search.set($event); store.setSearch($event); store.refresh()" />
    </div>
    <div class="card table-wrap">
      @if (store.loading()) { <p class="loading">Cargando...</p> }
      @else {
        <table>
          <thead><tr><th>Nombre</th><th>Tipo</th><th>Temporada</th><th>Días</th><th>Rendimiento</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (c of store.items(); track c.id) {
              <tr>
                <td><strong>{{ c.nombre }}</strong><br><small>{{ c.nombre_cientifico }}</small></td>
                <td><span class="badge badge--success">{{ c.tipo }}</span></td>
                <td>{{ c.temporada }}</td>
                <td>{{ c.dias_crecimiento }}</td>
                <td>{{ c.rendimiento_promedio }} qq/ha</td>
                <td class="actions">
                  @if (auth.canEdit()) { <a [routerLink]="['/cultivos', c.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                  @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(c.id!)">Eliminar</button> }
                </td>
              </tr>
            } @empty { <tr><td colspan="6" class="empty">Sin cultivos</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class CultivosListComponent implements OnInit {
  protected readonly store = inject(CultivosStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  protected readonly search = signal('');

  ngOnInit(): void { this.store.refresh(); }
  del(id: number): void {
    if (confirm('¿Eliminar cultivo?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
