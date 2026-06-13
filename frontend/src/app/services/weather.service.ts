import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { ClimaHuancayo, SincronizacionClima } from '../models';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly api = inject(ApiService);

  private readonly _clima = signal<ClimaHuancayo | null>(null);
  private readonly _loading = signal(false);
  private readonly _syncing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastSync = signal<SincronizacionClima | null>(null);

  readonly clima = this._clima.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly syncing = this._syncing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastSync = this._lastSync.asReadonly();

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.get<ClimaHuancayo>('clima/huancayo').subscribe({
      next: (res) => {
        this._clima.set(res.data);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err?.error?.message || 'No se pudo obtener el clima');
        this._loading.set(false);
      },
    });
  }

  setClima(data: ClimaHuancayo | null): void {
    this._clima.set(data);
  }

  sincronizar(loteId?: number) {
    this._syncing.set(true);
    this._error.set(null);
    return this.api
      .post<SincronizacionClima>('clima/sincronizar', loteId ? { lote_id: loteId } : {})
      .pipe(
        tap({
          next: (res) => this.applySyncResult(res.data),
          error: (err) => {
            this._error.set(err?.error?.message || 'Error al sincronizar');
          },
        }),
        finalize(() => this._syncing.set(false))
      );
  }

  sincronizarTodos() {
    this._syncing.set(true);
    this._error.set(null);
    return this.api.post<SincronizacionClima>('clima/sincronizar', { todos: true }).pipe(
      tap({
        next: (res) => this.applySyncResult(res.data),
        error: (err) => {
          this._error.set(err?.error?.message || 'Error al sincronizar');
        },
      }),
      finalize(() => this._syncing.set(false))
    );
  }

  private applySyncResult(data: SincronizacionClima): void {
    this._clima.set(data.clima);
    this._lastSync.set(data);
  }
}
