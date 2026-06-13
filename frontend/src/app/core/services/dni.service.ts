import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface DatosDni {
  dni: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  codVerifica?: number;
}

@Injectable({ providedIn: 'root' })
export class DniService {
  private readonly api = inject(ApiService);

  consultar(dni: string) {
    return this.api.get<DatosDni>(`auth/consulta-dni/${dni}`);
  }
}
