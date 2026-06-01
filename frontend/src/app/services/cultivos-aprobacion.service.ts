import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Cultivo } from '../models';

@Injectable({ providedIn: 'root' })
export class CultivosAprobacionService {
  private readonly api = inject(ApiService);

  aprobar(id: number) {
    return this.api.patch<Cultivo>(`cultivos/${id}/aprobar`, {});
  }

  rechazar(id: number, motivo?: string) {
    return this.api.patch<Cultivo>(`cultivos/${id}/rechazar`, { motivo });
  }
}
