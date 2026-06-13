import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Agricultor, Cultivo, Lote, RegistroAgricola, Sensor } from '../models';

/** Catálogos para selects en formularios */
@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly api = inject(ApiService);

  readonly agricultores = signal<Agricultor[]>([]);
  readonly cultivos = signal<Cultivo[]>([]);
  readonly lotes = signal<Lote[]>([]);
  readonly registros = signal<RegistroAgricola[]>([]);
  readonly sensores = signal<Sensor[]>([]);

  loadAgricultores(): void {
    this.api.getPaginated<Agricultor>('agricultores', { limit: 100 }).subscribe((r) => this.agricultores.set(r.data));
  }

  loadCultivos(soloAprobados = true): void {
    const params: Record<string, string | number> = { limit: 100 };
    if (soloAprobados) params['solo_aprobados'] = '1';
    this.api.getPaginated<Cultivo>('cultivos', params).subscribe((r) => this.cultivos.set(r.data));
  }

  loadLotes(opts?: { soloAprobados?: boolean; pendientes?: boolean }): void {
    const params: Record<string, string | number> = { limit: 100 };
    if (opts?.soloAprobados) params['solo_aprobados'] = '1';
    if (opts?.pendientes) params['pendientes'] = '1';
    this.api.getPaginated<Lote>('lotes', params).subscribe((r) => this.lotes.set(r.data));
  }

  loadRegistros(): void {
    this.api.getPaginated<RegistroAgricola>('registros', { limit: 100 }).subscribe((r) => this.registros.set(r.data));
  }

  loadSensores(): void {
    this.api.getPaginated<Sensor>('sensores', { limit: 200 }).subscribe((r) => this.sensores.set(r.data));
  }

  loadAll(): void {
    this.loadAgricultores();
    this.loadCultivos();
    this.loadLotes();
    this.loadRegistros();
    this.loadSensores();
  }
}
