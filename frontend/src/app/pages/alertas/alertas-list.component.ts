import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AlertasStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';

@Component({
  selector: 'app-alertas-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent, FormsModule],
  providers: [AlertasStore],
  templateUrl: './alertas-list.component.html',
  styleUrl: './alertas-list.component.scss',
})
export class AlertasListComponent implements OnInit {
  protected readonly store = inject(AlertasStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);

  protected readonly codigoLote = signal('');
  protected readonly nombre = signal('');
  protected readonly nivel = signal('');
  protected readonly tipo = signal('');

  private filterDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.syncStoreFilters();
  }

  onCodigoLoteChange(value: string): void {
    this.codigoLote.set(value);
    this.scheduleFilterSync();
  }

  onNombreChange(value: string): void {
    this.nombre.set(value);
    this.scheduleFilterSync();
  }

  onNivelChange(value: string): void {
    this.nivel.set(value);
    this.syncStoreFilters();
  }

  onTipoChange(value: string): void {
    this.tipo.set(value);
    this.syncStoreFilters();
  }

  clearFilters(): void {
    this.codigoLote.set('');
    this.nombre.set('');
    this.nivel.set('');
    this.tipo.set('');
    this.syncStoreFilters();
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const codigo = this.codigoLote().trim();
    const nombre = this.nombre().trim();
    if (codigo) filters['codigo_lote'] = codigo;
    if (nombre) filters['nombre'] = nombre;
    if (this.nivel()) filters['nivel'] = this.nivel();
    if (this.tipo()) filters['tipo'] = this.tipo();
    return filters;
  }

  private scheduleFilterSync(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.filterDebounce = setTimeout(() => this.syncStoreFilters(), 350);
  }

  private syncStoreFilters(): void {
    this.store.applyFilters(this.buildFilters());
  }

  del(id: number): void {
    if (confirm('¿Eliminar alerta?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
