import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CultivosStore } from '../../services/entity.service';
import { CultivosAprobacionService } from '../../services/cultivos-aprobacion.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { Cultivo } from '../../models';

@Component({
  selector: 'app-cultivos-list',
  imports: [PageHeaderComponent, RouterLink, FormsModule, RelationBannerComponent],
  providers: [CultivosStore],
  template: `
    <app-relation-banner
      hint="Catálogo de cultivos. Como agricultor puede solicitar uno nuevo; técnico o administrador lo aprueba antes de usarlo en lotes."
    />
    <app-page-header
      [title]="auth.isAgricultor() ? 'Cultivos' : 'Cultivos'"
      [subtitle]="auth.isAgricultor() ? 'Solicite nuevos productos para aprobación' : 'Catálogo y solicitudes pendientes'"
      [actionLabel]="auth.isAgricultor() ? 'Solicitar cultivo' : 'Nuevo cultivo'"
      [showAction]="auth.canEdit() || auth.isAgricultor()"
      (actionClick)="router.navigate(['/cultivos/nuevo'])"
    />
    @if (auth.canEdit()) {
      <div class="toolbar card filter-tabs">
        <button type="button" class="btn btn--sm" [class.btn--primary]="filtro() === 'todos'" (click)="setFiltro('todos')">Todos</button>
        <button type="button" class="btn btn--sm" [class.btn--primary]="filtro() === 'pendientes'" (click)="setFiltro('pendientes')">Pendientes de aprobar</button>
        <button type="button" class="btn btn--sm" [class.btn--primary]="filtro() === 'aprobados'" (click)="setFiltro('aprobados')">Aprobados</button>
      </div>
    }
    <div class="toolbar card">
      <input type="search" placeholder="Buscar cultivo..." [ngModel]="search()" (ngModelChange)="onSearch($event)" />
    </div>
    <div class="card table-wrap">
      @if (store.loading()) { <p class="loading">Cargando...</p> }
      @else {
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado solicitud</th>
              <th>Lote</th>
              @if (!auth.isAgricultor()) { <th>Lotes activos</th> }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (c of store.items(); track c.id) {
              <tr [class.row-pendiente]="c.estado_aprobacion === 'pendiente'">
                <td>
                  <strong>{{ c.nombre }}</strong>
                  @if (c.nombre_cientifico) { <br><small>{{ c.nombre_cientifico }}</small> }
                  @if (c.solicitante_nombre && auth.canEdit()) {
                    <br><small class="muted">Solicitó: {{ c.solicitante_nombre }}</small>
                  }
                </td>
                <td><span class="badge badge--success">{{ c.tipo }}</span></td>
                <td>
                  <span class="badge" [class]="aprobacionClass(c)">{{ aprobacionLabel(c) }}</span>
                  @if (c.estado_aprobacion === 'rechazado' && c.motivo_rechazo) {
                    <br><small class="muted">{{ c.motivo_rechazo }}</small>
                  }
                </td>
                <td>
                  @if (c.lote_solicitud_codigo) {
                    <span class="link-badge" title="Lote donde se usará este cultivo">
                      🗺️ {{ c.lote_solicitud_codigo }} — {{ c.lote_solicitud_nombre }}
                    </span>
                  } @else if (c.estado_aprobacion === 'aprobado' && c.total_lotes) {
                    <span class="muted">Ver lotes →</span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
                @if (!auth.isAgricultor()) {
                  <td>
                    @if (c.total_lotes && c.estado_aprobacion === 'aprobado') {
                      <a [routerLink]="['/lotes']" [queryParams]="{ cultivo_id: c.id }" class="link-badge">{{ c.total_lotes }} lote(s)</a>
                    } @else { <span class="muted">—</span> }
                  </td>
                }
                <td class="actions">
                  @if (c.estado_aprobacion === 'pendiente' && auth.canEdit()) {
                    <button type="button" class="btn btn--primary btn--sm" (click)="aprobar(c)">Aprobar</button>
                    <button type="button" class="btn btn--danger btn--sm" (click)="rechazar(c)">Rechazar</button>
                  }
                  @if (auth.canEdit() && c.estado_aprobacion === 'aprobado') {
                    <a [routerLink]="['/cultivos', c.id, 'editar']" class="btn btn--outline btn--sm">Editar</a>
                  }
                  @if (auth.isAgricultor() && c.estado_aprobacion === 'pendiente' && c.solicitado_por === auth.user()?.id) {
                    <a [routerLink]="['/cultivos', c.id, 'editar']" class="btn btn--outline btn--sm">Editar solicitud</a>
                  }
                  @if (auth.isAdmin() && c.estado_aprobacion === 'aprobado') {
                    <button class="btn btn--danger btn--sm" (click)="del(c.id!)">Eliminar</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td [attr.colspan]="auth.isAgricultor() ? 5 : 6" class="empty">Sin cultivos</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: `
    .filter-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .row-pendiente { background: #fffbeb; }
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class CultivosListComponent implements OnInit {
  protected readonly store = inject(CultivosStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  private readonly aprobacion = inject(CultivosAprobacionService);
  protected readonly search = signal('');
  protected readonly filtro = signal<'todos' | 'pendientes' | 'aprobados'>('todos');

  ngOnInit(): void {
    if (this.auth.canEdit()) this.filtro.set('pendientes');
    this.refresh();
  }

  onSearch(term: string): void {
    this.search.set(term);
    this.store.setSearch(term);
    this.refresh();
  }

  setFiltro(f: 'todos' | 'pendientes' | 'aprobados'): void {
    this.filtro.set(f);
    this.refresh();
  }

  private refresh(): void {
    const extra: Record<string, string> = {};
    if (this.filtro() === 'pendientes') extra['pendientes'] = '1';
    if (this.filtro() === 'aprobados') extra['solo_aprobados'] = '1';
    this.store.refresh(extra);
  }

  aprobacionLabel(c: Cultivo): string {
    const map = { aprobado: 'Aprobado', pendiente: 'Pendiente', rechazado: 'Rechazado' };
    return map[c.estado_aprobacion || 'aprobado'] || 'Aprobado';
  }

  aprobacionClass(c: Cultivo): string {
    const map = { aprobado: 'badge--success', pendiente: 'badge--warning', rechazado: 'badge--danger' };
    return map[c.estado_aprobacion || 'aprobado'] || 'badge--success';
  }

  aprobar(c: Cultivo): void {
    if (!confirm(`¿Aprobar el cultivo "${c.nombre}" para el catálogo?`)) return;
    this.aprobacion.aprobar(c.id!).subscribe(() => this.refresh());
  }

  rechazar(c: Cultivo): void {
    const motivo = prompt('Motivo del rechazo (opcional):') || undefined;
    this.aprobacion.rechazar(c.id!, motivo).subscribe(() => this.refresh());
  }

  del(id: number): void {
    if (confirm('¿Eliminar cultivo?')) this.store.remove(id).subscribe(() => this.refresh());
  }
}
