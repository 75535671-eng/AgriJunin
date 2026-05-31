import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Agricultor, Cultivo, Lote, RegistroAgricola } from '../models';

/** Catálogos para selects en formularios */
@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly api = inject(ApiService);

  readonly agricultores = signal<Agricultor[]>([]);
  readonly cultivos = signal<Cultivo[]>([]);
  readonly lotes = signal<Lote[]>([]);
  readonly registros = signal<RegistroAgricola[]>([]);

  loadAgricultores(): void {
    this.api.getPaginated<Agricultor>('agricultores', { limit: 100 }).subscribe((r) => this.agricultores.set(r.data));
  }

  loadCultivos(): void {
    this.api.getPaginated<Cultivo>('cultivos', { limit: 100 }).subscribe((r) => this.cultivos.set(r.data));
  }

  loadLotes(): void {
    this.api.getPaginated<Lote>('lotes', { limit: 100 }).subscribe((r) => this.lotes.set(r.data));
  }

  loadRegistros(): void {
    this.api.getPaginated<RegistroAgricola>('registros', { limit: 100 }).subscribe((r) => this.registros.set(r.data));
  }

  loadAll(): void {
    this.loadAgricultores();
    this.loadCultivos();
    this.loadLotes();
    this.loadRegistros();
  }
}
