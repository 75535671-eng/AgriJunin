import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LotesStore } from '../../services/entity.service';
import { LotesAprobacionService } from '../../services/lotes-aprobacion.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Lote } from '../../models';

@Component({
  selector: 'app-lotes-list',
  imports: [PageHeaderComponent, RouterLink, RelationBannerComponent],
  providers: [LotesStore],
  template: `
    <app-relation-banner
      hint="Cada fila es un LOTE: pertenece a un agricultor y tiene un cultivo asignado. Desde aquí se vinculan sensores y registros."
    />
    <app-page-header
      title="Lotes agrícolas"
      [subtitle]="subtitle()"
      [showAction]="auth.canManageLotes()"
      actionLabel="Nuevo lote"
      (actionClick)="router.navigate(['/lotes/nuevo'])"
    />

    @if (auth.canEdit()) {
      <div class="filtros card">
        <button type="button" class="btn btn--sm" [class.btn--outline]="filtro() !== 'todos'" [class.btn--primary]="filtro() === 'todos'" (click)="setFiltro('todos')">Todos</button>
        <button type="button" class="btn btn--sm" [class.btn--outline]="filtro() !== 'pendientes'" [class.btn--primary]="filtro() === 'pendientes'" (click)="setFiltro('pendientes')">Pendientes de aprobar</button>
        <button type="button" class="btn btn--sm" [class.btn--outline]="filtro() !== 'aprobados'" [class.btn--primary]="filtro() === 'aprobados'" (click)="setFiltro('aprobados')">Aprobados</button>
      </div>
    }

    @if (filterLabel()) {
      <div class="filter-chip card">
        <span>Filtro activo: {{ filterLabel() }}</span>
        <button type="button" class="btn btn--outline btn--sm" (click)="clearFilters()">Ver todos los lotes</button>
      </div>
    }
    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            @if (!auth.isAgricultor()) { <th>Agricultor</th> }
            <th>Cultivo</th>
            <th>Área</th>
            <th>Parcela</th>
            <th>Aprobación</th>
            <th>Relacionado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (l of store.items(); track l.id) {
            <tr [class.row-pendiente]="l.estado_aprobacion === 'pendiente'">
              <td><code>{{ l.codigo_lote }}</code></td>
              <td>{{ l.nombre }}</td>
              @if (!auth.isAgricultor()) {
                <td>
                  <a [routerLink]="['/lotes']" [queryParams]="{ agricultor_id: l.agricultor_id }" class="link">
                    {{ l.agricultor_nombres }} {{ l.agricultor_apellidos }}
                  </a>
                </td>
              }
              <td>
                <a [routerLink]="['/lotes']" [queryParams]="{ cultivo_id: l.cultivo_id }" class="link">
                  {{ l.cultivo_nombre || '—' }}
                </a>
              </td>
              <td>{{ l.area_hectareas }} ha</td>
              <td><span class="badge badge--info">{{ l.estado }}</span></td>
              <td>
                <span class="badge" [class]="aprobacionClass(l)">{{ aprobacionLabel(l) }}</span>
                @if (l.estado_aprobacion === 'rechazado' && l.motivo_rechazo) {
                  <small class="motivo">{{ l.motivo_rechazo }}</small>
                }
              </td>
              <td class="rel-links">
                @if (l.estado_aprobacion === 'aprobado') {
                  <a [routerLink]="['/sensores']" [queryParams]="{ lote_id: l.id }" class="btn btn--outline btn--sm">Sensores</a>
                  <a [routerLink]="['/registros']" [queryParams]="{ lote_id: l.id }" class="btn btn--outline btn--sm">Registros</a>
                }
              </td>
              <td class="actions">
                @if (l.estado_aprobacion === 'pendiente' && auth.canEdit()) {
                  <button type="button" class="btn btn--primary btn--sm" (click)="aprobar(l)">Aprobar</button>
                  <button type="button" class="btn btn--danger btn--sm" (click)="rechazar(l)">Rechazar</button>
                }
                @if (auth.canManageLotes() && (l.estado_aprobacion !== 'rechazado' || auth.canEdit())) {
                  <a [routerLink]="['/lotes', l.id, 'editar']" class="btn btn--outline btn--sm">Editar</a>
                }
                @if (auth.isAdmin() && l.estado_aprobacion === 'aprobado') {
                  <button class="btn btn--danger btn--sm" (click)="del(l.id!)">Eliminar</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td [attr.colspan]="auth.isAgricultor() ? 8 : 9" class="empty">Sin lotes</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .filtros { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .filter-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
    }
    .link { color: var(--primary); font-weight: 500; }
    .rel-links { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    code { font-size: 0.8rem; background: #f0f4f0; padding: 0.1rem 0.35rem; border-radius: 4px; }
    .row-pendiente { background: #fffbeb; }
    .motivo { display: block; color: var(--text-muted); margin-top: 0.2rem; }
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class LotesListComponent implements OnInit {
  protected readonly store = inject(LotesStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly aprobacion = inject(LotesAprobacionService);

  protected readonly filtro = signal<'todos' | 'pendientes' | 'aprobados'>('todos');

  private readonly agricultorFilter = signal<number | null>(null);
  private readonly cultivoFilter = signal<number | null>(null);
  readonly filterLabel = computed(() => {
    const parts: string[] = [];
    if (this.agricultorFilter()) parts.push(`Agricultor #${this.agricultorFilter()}`);
    if (this.cultivoFilter()) parts.push(`Cultivo #${this.cultivoFilter()}`);
    return parts.join(' · ');
  });

  readonly subtitle = computed(() =>
    this.auth.isAgricultor()
      ? 'Sus parcelas: las nuevas requieren aprobación de técnico o administrador'
      : 'Cada lote une un agricultor con un cultivo — apruebe las solicitudes pendientes'
  );

  ngOnInit(): void {
    if (this.auth.canEdit()) this.filtro.set('pendientes');
    this.route.queryParamMap.subscribe((params) => {
      const agId = params.get('agricultor_id');
      const culId = params.get('cultivo_id');
      this.agricultorFilter.set(agId ? +agId : null);
      this.cultivoFilter.set(culId ? +culId : null);
      this.applyFilters();
    });
  }

  setFiltro(f: 'todos' | 'pendientes' | 'aprobados'): void {
    this.filtro.set(f);
    this.applyFilters();
  }

  private applyFilters(): void {
    const f: Record<string, string | number> = {};
    if (this.agricultorFilter()) f['agricultor_id'] = this.agricultorFilter()!;
    if (this.cultivoFilter()) f['cultivo_id'] = this.cultivoFilter()!;
    if (this.filtro() === 'pendientes') f['pendientes'] = '1';
    if (this.filtro() === 'aprobados') f['solo_aprobados'] = '1';
    this.store.setFilters(f);
    this.store.refresh();
  }

  clearFilters(): void {
    this.router.navigate(['/lotes']);
    this.store.clearAllFilters();
    if (this.auth.canEdit()) this.filtro.set('pendientes');
    else this.filtro.set('todos');
    this.applyFilters();
  }

  aprobacionLabel(l: Lote): string {
    const map = { aprobado: 'Aprobado', pendiente: 'Pendiente', rechazado: 'Rechazado' };
    return map[l.estado_aprobacion || 'aprobado'] || 'Aprobado';
  }

  aprobacionClass(l: Lote): string {
    const map = { aprobado: 'badge--success', pendiente: 'badge--warning', rechazado: 'badge--danger' };
    return map[l.estado_aprobacion || 'aprobado'] || 'badge--success';
  }

  aprobar(l: Lote): void {
    this.aprobacion.aprobar(l.id!).subscribe(() => this.store.refresh());
  }

  rechazar(l: Lote): void {
    const motivo = prompt('Motivo del rechazo (opcional):') || undefined;
    this.aprobacion.rechazar(l.id!, motivo).subscribe(() => this.store.refresh());
  }

  del(id: number): void {
    if (confirm('¿Eliminar lote? También afectará sensores y registros vinculados.')) {
      this.store.remove(id).subscribe(() => this.store.refresh());
    }
  }
}
