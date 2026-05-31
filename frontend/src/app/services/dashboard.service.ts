import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _loading = signal(false);

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(): void {
    this._loading.set(true);
    this.api.get<DashboardStats>('dashboard/stats').subscribe({
      next: (res) => {
        this._stats.set(res.data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
