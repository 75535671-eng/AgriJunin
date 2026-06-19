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
  templateUrl: './cultivos-list.component.html',
  styleUrls: ['./cultivos-list.component.scss', '../agricultores/crud-list.scss'],
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
    this.applyFilters();
  }

  onSearch(term: string): void {
    this.search.set(term);
    this.store.setSearch(term);
    this.applyFilters();
  }

  setFiltro(f: 'todos' | 'pendientes' | 'aprobados'): void {
    this.filtro.set(f);
    this.applyFilters();
  }

  private applyFilters(): void {
    const filters: Record<string, string> = {};
    if (this.filtro() === 'pendientes') filters['pendientes'] = '1';
    else if (this.filtro() === 'aprobados') filters['solo_aprobados'] = '1';
    this.store.setFilters(filters);
    this.store.setPage(1);
  }

  private refresh(): void {
    this.store.refresh();
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
