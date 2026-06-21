import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AlertasStore } from '../../services/entity.service';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { Alerta, Pagination } from '../../models';

interface AlertaFilters {
  codigo_lote: string;
  nombre: string;
  nivel: string;
  tipo: string;
}

@Component({
  selector: 'app-alertas-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent, FormsModule],
  providers: [AlertasStore],
  templateUrl: './alertas-list.component.html',
  styleUrl: './alertas-list.component.scss',
})
export class AlertasListComponent implements OnInit {
  private readonly store = inject(AlertasStore);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);

  protected readonly codigoLote = signal('');
  protected readonly nombre = signal('');
  protected readonly nivel = signal('');
  protected readonly tipo = signal('');
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

  private readonly filters = computed<AlertaFilters>(() => ({
    codigo_lote: this.codigoLote().trim(),
    nombre: this.nombre().trim(),
    nivel: this.nivel(),
    tipo: this.tipo(),
  }));

  protected readonly hasActiveFilters = computed(
    () =>
      !!this.filters().codigo_lote ||
      !!this.filters().nombre ||
      !!this.filters().nivel ||
      !!this.filters().tipo
  );

  protected readonly activeFilterLabels = computed(() => {
    const f = this.filters();
    const labels: string[] = [];
    if (f.codigo_lote) labels.push(`Lote: ${f.codigo_lote}`);
    if (f.nombre) labels.push(`Nombre: ${f.nombre}`);
    if (f.nivel) labels.push(`Nivel: ${f.nivel}`);
    if (f.tipo) labels.push(`Tipo: ${f.tipo}`);
    return labels;
  });

  /** Segunda capa: asegura que lo mostrado cumple los filtros activos. */
  protected readonly visibleItems = computed(() =>
    this.items().filter((a) => this.matchesFilters(a, this.filters()))
  );

  constructor() {
    combineLatest([
      toObservable(this.filters).pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.page.set(1))
      ),
      toObservable(this.page).pipe(distinctUntilChanged()),
    ])
      .pipe(
        switchMap(([filters, page]) => {
          this.loading.set(true);
          this.error.set(null);
          const params: Record<string, string | number> = { page, limit: 10 };
          if (filters.codigo_lote) params['codigo_lote'] = filters.codigo_lote;
          if (filters.nombre) params['nombre'] = filters.nombre;
          if (filters.nivel) params['nivel'] = filters.nivel;
          if (filters.tipo) params['tipo'] = filters.tipo;
          return this.api.getPaginated<Alerta>('alertas', params).pipe(
            map((res) => ({
              ...res,
              data: res.data.filter((a) => this.matchesFilters(a, filters)),
            })),
            catchError((err) => {
              this.error.set(err?.error?.message || 'Error al cargar alertas');
              return of({
                success: false,
                message: '',
                data: [] as Alerta[],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
              });
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.items.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      });
  }

  ngOnInit(): void {
    // Dispara la primera carga vía combineLatest (signals ya inicializados).
    this.page.set(1);
  }

  clearFilters(): void {
    this.codigoLote.set('');
    this.nombre.set('');
    this.nivel.set('');
    this.tipo.set('');
  }

  prevPage(): void {
    if (this.pagination().page > 1) {
      this.page.set(this.pagination().page - 1);
    }
  }

  nextPage(): void {
    if (this.pagination().page < this.pagination().totalPages) {
      this.page.set(this.pagination().page + 1);
    }
  }

  del(id: number): void {
    if (!confirm('¿Eliminar alerta?')) return;
    this.store.remove(id).subscribe(() => this.page.set(this.page()));
  }

  private matchesFilters(a: Alerta, f: AlertaFilters): boolean {
    if (f.nivel && a.nivel !== f.nivel) return false;
    if (f.tipo && a.tipo !== f.tipo) return false;
    if (f.codigo_lote) {
      const code = (a.codigo_lote || '').toLowerCase();
      if (!code.includes(f.codigo_lote.toLowerCase())) return false;
    }
    if (f.nombre) {
      const term = f.nombre.toLowerCase();
      const haystack = [a.titulo, a.mensaje, a.agricultor_nombre, a.lote_nombre, a.codigo_lote]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }
}
