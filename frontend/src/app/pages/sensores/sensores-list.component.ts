import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SensoresStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-sensores-list',
  imports: [PageHeaderComponent, RouterLink, RelationBannerComponent],
  providers: [SensoresStore],
  template: `
    <app-relation-banner hint="Cada sensor está instalado en un lote (agricultor + cultivo)." />
    <app-page-header title="Sensores IoT" subtitle="Vinculados a un lote concreto"
      actionLabel="Nuevo sensor" [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/sensores/nuevo'])" />
    @if (filterLoteId()) {
      <div class="filter-chip card">
        <span>Filtrando por lote #{{ filterLoteId() }}</span>
        <a routerLink="/sensores" class="btn btn--outline btn--sm">Ver todos</a>
      </div>
    }
    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Agricultor</th>
            <th>Lote</th>
            <th>Cultivo</th>
            <th>Última lectura</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (s of store.items(); track s.id) {
            <tr>
              <td>{{ s.codigo_sensor }}</td>
              <td>{{ s.nombre }}</td>
              <td>{{ s.agricultor_nombre || '—' }}</td>
              <td>
                <a [routerLink]="['/sensores']" [queryParams]="{ lote_id: s.lote_id }">{{ s.lote_nombre }}</a>
              </td>
              <td>{{ s.cultivo_nombre || '—' }}</td>
              <td>{{ s.ultima_lectura }} {{ s.unidad_medida }}</td>
              <td>
                <span class="badge" [class.badge--success]="s.estado==='activo'" [class.badge--warning]="s.estado==='mantenimiento'">{{ s.estado }}</span>
              </td>
              <td class="actions">
                @if (auth.canEdit()) { <a [routerLink]="['/sensores', s.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(s.id!)">Eliminar</button> }
              </td>
            </tr>
          } @empty { <tr><td colspan="8" class="empty">Sin sensores</td></tr> }
        </tbody>
      </table>
    </div>
  `,
  styles: `.filter-chip { display:flex; justify-content:space-between; align-items:center; padding:0.65rem 1rem; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem; }`,
  styleUrl: '../agricultores/crud-list.scss',
})
export class SensoresListComponent implements OnInit {
  protected readonly store = inject(SensoresStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly filterLoteId = signal<number | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const loteId = params.get('lote_id');
      this.filterLoteId.set(loteId ? +loteId : null);
      if (loteId) {
        this.store.setFilters({ lote_id: +loteId });
      } else {
        this.store.clearFilters();
      }
      this.store.refresh();
    });
  }

  del(id: number): void {
    if (confirm('¿Eliminar sensor?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
