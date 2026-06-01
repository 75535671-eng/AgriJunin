import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Lote } from '../models';

@Injectable({ providedIn: 'root' })
export class LotesAprobacionService {
  private readonly api = inject(ApiService);

  aprobar(id: number) {
    return this.api.patch<Lote>(`lotes/${id}/aprobar`, {});
  }

  rechazar(id: number, motivo?: string) {
    return this.api.patch<Lote>(`lotes/${id}/rechazar`, { motivo });
  }
}
