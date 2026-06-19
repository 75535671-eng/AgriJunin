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
  protected readonly nivel = signal('');
  protected readonly tipo = signal('');

  ngOnInit(): void {
    this.store.setPage(1);
    this.applyFilters();
  }

  onCodigoLoteChange(value: string): void {
    this.codigoLote.set(value);
    this.applyFilters();
  }

  onNivelChange(value: string): void {
    this.nivel.set(value);
    this.applyFilters();
  }

  onTipoChange(value: string): void {
    this.tipo.set(value);
    this.applyFilters();
  }

  clearFilters(): void {
    this.codigoLote.set('');
    this.nivel.set('');
    this.tipo.set('');
    this.applyFilters();
  }

  private applyFilters(): void {
    const filters: Record<string, string> = {};
    const codigo = this.codigoLote().trim();
    if (codigo) filters['codigo_lote'] = codigo;
    if (this.nivel()) filters['nivel'] = this.nivel();
    if (this.tipo()) filters['tipo'] = this.tipo();
    this.store.setFilters(filters);
    this.store.refresh();
  }

  del(id: number): void {
    if (confirm('¿Eliminar alerta?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
