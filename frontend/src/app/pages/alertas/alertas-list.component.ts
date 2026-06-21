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
  merge,
  of,
  skip,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AlertasStore } from '../../services/entity.service';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { Alerta, Pagination } from '../../models';

interface AlertaQuery {
  codigo_lote: string;
  agricultor: string;
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

  private readonly textQuery = computed<Pick<AlertaQuery, 'codigo_lote' | 'agricultor'>>(() => ({
    codigo_lote: this.filtroCodigoLote().trim(),
    agricultor: this.filtroAgricultor().trim(),
  }));

  private readonly selectQuery = computed<Pick<AlertaQuery, 'nivel' | 'tipo'>>(() => ({
    nivel: this.filtroNivel(),
    tipo: this.filtroTipo(),
  }));

  private readonly query = computed<AlertaQuery>(() => ({
    ...this.textQuery(),
    ...this.selectQuery(),
  }));

  protected readonly hasActiveFilters = computed(() => {
    const q = this.query();
    return !!(q.codigo_lote || q.agricultor || q.nivel || q.tipo);
  });

  protected readonly activeFilterLabels = computed(() => {
    const q = this.query();
    const labels: string[] = [];
    if (q.codigo_lote) labels.push(`Lote: ${q.codigo_lote}`);
    if (q.agricultor) labels.push(`Agricultor: ${q.agricultor}`);
    if (q.nivel) labels.push(`Nivel: ${q.nivel}`);
    if (q.tipo) labels.push(`Tipo: ${q.tipo}`);
    return labels;
  });

  constructor() {
    const textChanges$ = toObservable(this.textQuery);
    const debouncedText$ = merge(
      textChanges$.pipe(take(1)),
      textChanges$.pipe(skip(1), debounceTime(300))
    ).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => this.page.set(1))
    );

    const immediateSelect$ = toObservable(this.selectQuery).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => this.page.set(1))
    );

    combineLatest([debouncedText$, immediateSelect$, toObservable(this.page).pipe(distinctUntilChanged())])
      .pipe(
        map(([text, select, page]) => ({ ...text, ...select, page })),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.items.set([]);
        }),
        switchMap((q) => {
          const seq = ++this.loadSeq;
          const params: Record<string, string | number> = { page: q.page, limit: 10 };
          if (q.codigo_lote) params['codigo_lote'] = q.codigo_lote;
          if (q.agricultor) params['nombre'] = q.agricultor;
          if (q.nivel) params['nivel'] = q.nivel;
          if (q.tipo) params['tipo'] = q.tipo;
          return this.api.getPaginated<Alerta>('alertas', params).pipe(
            map((res) => ({ seq, res })),
            catchError((err) => {
              if (seq !== this.loadSeq) return of(null);
              this.error.set(err?.error?.message || 'Error al cargar alertas');
              return of({
                seq,
                res: {
                  success: false,
                  message: '',
                  data: [] as Alerta[],
                  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
                },
              });
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((payload) => {
        if (!payload || payload.seq !== this.loadSeq) return;
        this.items.set(payload.res.data);
        this.pagination.set(payload.res.pagination);
        this.loading.set(false);
      });
  }

  ngOnInit(): void {
    this.page.set(1);
  }

  clearFilters(): void {
    this.filtroCodigoLote.set('');
    this.filtroAgricultor.set('');
    this.filtroNivel.set('');
    this.filtroTipo.set('');
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
}
