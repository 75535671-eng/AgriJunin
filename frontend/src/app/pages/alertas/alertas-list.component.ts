import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AlertasStore } from '../../services/entity.service';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { Alerta, Pagination } from '../../models';

@Component({
  selector: 'app-alertas-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent, FormsModule],
  providers: [AlertasStore],
  templateUrl: './alertas-list.component.html',
  styleUrl: './alertas-list.component.scss',
})
export class AlertasListComponent implements OnInit, OnDestroy {
  private readonly store = inject(AlertasStore);
  private readonly api = inject(ApiService);

  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);

  protected readonly filtroCodigoLote = signal('');
  protected readonly filtroAgricultor = signal('');
  protected readonly filtroNivel = signal('');
  protected readonly filtroTipo = signal('');
  protected readonly page = signal(1);

  protected readonly items = signal<Alerta[]>([]);
  protected readonly pagination = signal<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private loadSeq = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly hasActiveFilters = computed(() => {
    return !!(
      this.filtroCodigoLote().trim() ||
      this.filtroAgricultor().trim() ||
      this.filtroNivel() ||
      this.filtroTipo()
    );
  });

  protected readonly activeFilterLabels = computed(() => {
    const labels: string[] = [];
    const lote = this.filtroCodigoLote().trim();
    const agri = this.filtroAgricultor().trim();
    if (lote) labels.push(`Lote: ${lote}`);
    if (agri) labels.push(`Agricultor: ${agri}`);
    if (this.filtroNivel()) labels.push(`Nivel: ${this.filtroNivel()}`);
    if (this.filtroTipo()) labels.push(`Tipo: ${this.filtroTipo()}`);
    return labels;
  });

  ngOnInit(): void {
    this.loadAlertas();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  onCodigoLoteChange(value: string): void {
    this.filtroCodigoLote.set(value);
    this.scheduleReload();
  }

  onAgricultorChange(value: string): void {
    this.filtroAgricultor.set(value);
    this.scheduleReload();
  }

  onNivelChange(value: string): void {
    this.filtroNivel.set(value);
    this.page.set(1);
    this.loadAlertas();
  }

  onTipoChange(value: string): void {
    this.filtroTipo.set(value);
    this.page.set(1);
    this.loadAlertas();
  }

  clearFilters(): void {
    this.filtroCodigoLote.set('');
    this.filtroAgricultor.set('');
    this.filtroNivel.set('');
    this.filtroTipo.set('');
    this.page.set(1);
    this.loadAlertas();
  }

  prevPage(): void {
    if (this.pagination().page > 1) {
      this.page.set(this.pagination().page - 1);
      this.loadAlertas();
    }
  }

  nextPage(): void {
    if (this.pagination().page < this.pagination().totalPages) {
      this.page.set(this.pagination().page + 1);
      this.loadAlertas();
    }
  }

  del(id: number): void {
    if (!confirm('¿Eliminar alerta?')) return;
    this.store.remove(id).subscribe(() => this.loadAlertas());
  }

  private scheduleReload(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.page.set(1);
      this.loadAlertas();
    }, 300);
  }

  private loadAlertas(): void {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    this.error.set(null);
    this.items.set([]);

    const params: Record<string, string | number> = {
      page: this.page(),
      limit: 10,
    };

    const codigo = this.filtroCodigoLote().trim();
    const agricultor = this.filtroAgricultor().trim();
    if (codigo) params['codigo_lote'] = codigo;
    if (agricultor) params['nombre'] = agricultor;
    if (this.filtroNivel()) params['nivel'] = this.filtroNivel();
    if (this.filtroTipo()) params['tipo'] = this.filtroTipo();

    this.api.getPaginated<Alerta>('alertas', params).subscribe({
      next: (res) => {
        if (seq !== this.loadSeq) return;
        this.items.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: (err) => {
        if (seq !== this.loadSeq) return;
        this.error.set(err?.error?.message || 'Error al cargar alertas');
        this.items.set([]);
        this.pagination.set({ page: 1, limit: 10, total: 0, totalPages: 0 });
        this.loading.set(false);
      },
    });
  }
}
