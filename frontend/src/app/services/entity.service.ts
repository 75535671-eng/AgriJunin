import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService, QueryParams } from '../core/services/api.service';
import {
  Pagination,
  Agricultor,
  Cultivo,
  Lote,
  Sensor,
  RegistroAgricola,
  Alerta,
} from '../models';

/**
 * Servicio base CRUD con estado reactivo via Signals
 */
export class EntityStore<T> {
  private readonly api = inject(ApiService);
  protected readonly endpoint: string;

  private readonly _items = signal<T[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pagination = signal<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  private readonly _search = signal('');
  private readonly _filters = signal<QueryParams>({});

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly search = this._search.asReadonly();
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  setSearch(term: string): void {
    this._search.set(term);
  }

  setFilters(filters: QueryParams): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
  }

  filters(): QueryParams {
    return this._filters();
  }

  load(extra: QueryParams = {}): void {
    this._loading.set(true);
    this._error.set(null);
    this.api
      .getPaginated<T>(this.endpoint, {
        page: this._pagination().page,
        limit: this._pagination().limit,
        search: this._search() || undefined,
        ...this._filters(),
        ...extra,
      })
      .subscribe({
        next: (res) => {
          this._items.set(res.data);
          this._pagination.set(res.pagination);
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err?.error?.message || 'Error al cargar datos');
          this._loading.set(false);
        },
      });
  }

  getById(id: number) {
    return this.api.get<T>(`${this.endpoint}/${id}`);
  }

  create(data: Partial<T>) {
    return this.api.post<T>(this.endpoint, data);
  }

  update(id: number, data: Partial<T>) {
    return this.api.put<T>(`${this.endpoint}/${id}`, data);
  }

  remove(id: number) {
    return this.api.delete<null>(`${this.endpoint}/${id}`);
  }

  setPage(page: number): void {
    this._pagination.update((p) => ({ ...p, page }));
    this.load();
  }

  refresh(extra?: QueryParams): void {
    this.load(extra);
  }
}

@Injectable()
export class LotesStore extends EntityStore<Lote> {
  constructor() {
    super('lotes');
  }

  filterByAgricultor(agricultorId: number | null): void {
    const f = { ...this.filters() };
    if (agricultorId) f['agricultor_id'] = agricultorId;
    else delete f['agricultor_id'];
    this.setFilters(f);
    this.setPage(1);
  }

  filterByCultivo(cultivoId: number | null): void {
    const f = { ...this.filters() };
    if (cultivoId) f['cultivo_id'] = cultivoId;
    else delete f['cultivo_id'];
    this.setFilters(f);
    this.setPage(1);
  }

  clearAllFilters(): void {
    this.clearFilters();
    this.setPage(1);
  }
}

@Injectable()
export class AgricultoresStore extends EntityStore<Agricultor> {
  constructor() { super('agricultores'); }
}

@Injectable()
export class CultivosStore extends EntityStore<Cultivo> {
  constructor() { super('cultivos'); }
}

@Injectable()
export class SensoresStore extends EntityStore<Sensor> {
  constructor() { super('sensores'); }
}

@Injectable()
export class RegistrosStore extends EntityStore<RegistroAgricola> {
  constructor() { super('registros'); }
}

@Injectable()
export class AlertasStore extends EntityStore<Alerta> {
  constructor() { super('alertas'); }
}
