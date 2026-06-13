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
  templateUrl: './lotes-list.component.html',
  styleUrls: ['./lotes-list.component.scss', '../agricultores/crud-list.scss'],
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
