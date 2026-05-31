import { Injectable, inject, signal } from '@angular/core';
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

  sincronizar(loteId?: number): void {
    this._syncing.set(true);
    this._error.set(null);
    this.api.post<SincronizacionClima>('clima/sincronizar', loteId ? { lote_id: loteId } : {}).subscribe({
      next: (res) => {
        this._clima.set(res.data.clima);
        this._lastSync.set(res.data);
        this._syncing.set(false);
      },
      error: (err) => {
        this._error.set(err?.error?.message || 'Error al sincronizar');
        this._syncing.set(false);
      },
    });
  }
}
