import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RegistrosStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-registros-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent],
  providers: [RegistrosStore],
  template: `
    <app-relation-banner hint="Cada registro pertenece a un lote (y por tanto a un agricultor y cultivo)." />
    <app-page-header title="Registros agrícolas" subtitle="Mediciones vinculadas a lote → agricultor + cultivo"
      actionLabel="Nuevo registro" [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/registros/nuevo'])" />
    @if (filterLoteId()) {
      <div class="filter-chip card">
        <span>Filtrando por lote #{{ filterLoteId() }}</span>
        <a routerLink="/registros" class="btn btn--outline btn--sm">Ver todos</a>
      </div>
    }
    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Agricultor</th>
            <th>Lote</th>
            <th>Cultivo</th>
            <th>Temp °C</th>
            <th>Humedad %</th>
            <th>Producción kg</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (r of store.items(); track r.id) {
            <tr>
              <td>{{ r.fecha_registro | date:'short' }}</td>
              <td>{{ r.agricultor_nombre || '—' }}</td>
              <td>
                <a [routerLink]="['/registros']" [queryParams]="{ lote_id: r.lote_id }">{{ r.lote_nombre }}</a>
              </td>
              <td>{{ r.cultivo_nombre }}</td>
              <td>{{ r.temperatura ?? '—' }}</td>
              <td>{{ r.humedad_suelo ?? '—' }}</td>
              <td>{{ r.produccion_kg ?? '—' }}</td>
              <td class="actions">
                @if (auth.canEdit()) { <a [routerLink]="['/registros', r.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(r.id!)">Eliminar</button> }
              </td>
            </tr>
          } @empty { <tr><td colspan="8" class="empty">Sin registros</td></tr> }
        </tbody>
      </table>
    </div>
  `,
  styles: `.filter-chip { display:flex; justify-content:space-between; align-items:center; padding:0.65rem 1rem; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem; }`,
  styleUrl: '../agricultores/crud-list.scss',
})
export class RegistrosListComponent implements OnInit {
  protected readonly store = inject(RegistrosStore);
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
    if (confirm('¿Eliminar registro?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
