import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { BusquedaPlantas } from '../models';

@Injectable({ providedIn: 'root' })
export class PlantasService {
  private readonly api = inject(ApiService);

  buscar(query: string) {
    return this.api.get<BusquedaPlantas>('plantas/buscar', { q: query });
  }
}
