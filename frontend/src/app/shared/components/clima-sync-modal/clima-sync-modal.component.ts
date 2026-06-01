import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeatherService } from '../../../services/weather.service';
import { LookupService } from '../../../services/lookup.service';
import { ClimaSyncPromptService } from '../../../core/services/clima-sync-prompt.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ClimaWidgetComponent } from '../clima-widget/clima-widget.component';

/** Tiempo mínimo visible tras sincronizar antes de cerrar el modal */
const CERRAR_MODAL_MS = 3000;

@Component({
  selector: 'app-clima-sync-modal',
  imports: [FormsModule, ClimaWidgetComponent],
  template: `
    @if (prompt.isVisible()) {
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card card">
          <h2>🌤️ ¿Sincronizar clima de Huancayo?</h2>
          @if (isStaff()) {
            <p class="modal-desc">
              Como {{ auth.roleLabel() }}, el clima se importará automáticamente a
              <strong>todos los lotes activos</strong> (registros, sensores y alertas).
              Si continúa sin sincronizar, verá los datos que ya tenía guardados.
            </p>
          } @else {
            <p class="modal-desc">
              Puede importar el clima real de Open-Meteo a <strong>registros</strong>,
              <strong>sensores</strong> y <strong>alertas</strong> de su lote.
              Si continúa sin sincronizar, verá los datos que ya tenía guardados en el sistema.
            </p>
          }

          @if (weather.loading()) {
            <p class="loading">Cargando clima actual...</p>
          } @else if (weather.clima(); as c) {
            <div class="modal-clima">
              <app-clima-widget [clima]="c" />
            </div>
          }

          @if (!isStaff() && lotes().length > 1) {
            <div class="form-group">
              <label>Lote a actualizar</label>
              <select [ngModel]="loteId()" (ngModelChange)="loteId.set(+$event)">
                @for (l of lotes(); track l.id) {
                  <option [value]="l.id">{{ l.codigo_lote }} — {{ l.nombre }}</option>
                }
              </select>
            </div>
          }

          @if (isStaff() && lotes().length) {
            <p class="info-badge">
              Se actualizarán <strong>{{ lotes().length }}</strong> lote(s) activo(s) con el mismo clima de Huancayo.
            </p>
          }

          @if (resultMsg()) {
            <div class="alert alert--success">{{ resultMsg() }}</div>
          }
          @if (weather.error()) {
            <div class="alert alert--error">{{ weather.error() }}</div>
          }

          @if (weather.syncing() && isStaff()) {
            <p class="loading">Sincronizando todos los lotes...</p>
          }

          <label class="checkbox-skip">
            <input type="checkbox" [ngModel]="skipFuture()" (ngModelChange)="skipFuture.set($event)" />
            No volver a mostrar al iniciar sesión
          </label>

          <div class="modal-actions">
            @if (!isStaff()) {
              <button
                type="button"
                class="btn btn--primary"
                (click)="sincronizarUnLote()"
                [disabled]="weather.syncing() || !lotes().length"
              >
                {{ weather.syncing() ? 'Sincronizando...' : 'Sincronizar con sistema' }}
              </button>
            }
            <button type="button" class="btn btn--outline" (click)="continuar()" [disabled]="weather.syncing()">
              {{ isStaff() && weather.syncing() ? 'Omitir (en curso)...' : 'Continuar sin sincronizar' }}
            </button>
          </div>

          @if (!lotes().length) {
            <p class="muted">No hay lotes activos. Continúe para usar el sistema con los datos existentes.</p>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-card {
      max-width: 520px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.5rem;
    }
    h2 { margin: 0 0 0.5rem; color: var(--primary-dark); font-size: 1.25rem; }
    .modal-desc { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.45; }
    .modal-clima { margin-bottom: 1rem; transform: scale(0.95); transform-origin: top center; }
    .info-badge {
      font-size: 0.85rem;
      background: #e8f5e9;
      color: var(--primary-dark);
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }
    .modal-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
    .modal-actions .btn { width: 100%; justify-content: center; }
    .checkbox-skip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      margin-top: 0.75rem;
      color: var(--text-muted);
    }
    .alert { padding: 0.65rem; border-radius: 8px; margin-top: 0.75rem; font-size: 0.85rem; }
    .alert--success { background: #e8f5e9; color: var(--primary-dark); }
    .alert--error { background: #ffebee; color: #c62828; }
    .muted { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; }
    .loading { text-align: center; color: var(--text-muted); }
  `,
})
export class ClimaSyncModalComponent implements OnInit {
  protected readonly prompt = inject(ClimaSyncPromptService);
  protected readonly weather = inject(WeatherService);
  protected readonly lookup = inject(LookupService);
  protected readonly auth = inject(AuthStateService);

  protected readonly loteId = signal<number | undefined>(undefined);
  protected readonly resultMsg = signal<string | null>(null);
  protected readonly skipFuture = signal(false);

  protected readonly lotes = computed(() => this.lookup.lotes());
  protected readonly isStaff = computed(() => this.auth.isAdmin() || this.auth.isTecnico());

  private autoSyncStarted = false;

  constructor() {
    effect(() => {
      const lots = this.lotes();
      if (lots.length && this.loteId() == null) {
        this.loteId.set(lots[0].id);
      }
    });

    effect(() => {
      if (
        !this.prompt.isVisible() ||
        !this.isStaff() ||
        this.autoSyncStarted ||
        this.weather.loading() ||
        !this.weather.clima() ||
        !this.lotes().length
      ) {
        return;
      }
      this.autoSyncStarted = true;
      this.sincronizarTodos();
    });
  }

  ngOnInit(): void {
    this.lookup.loadLotes();
    this.weather.load();
  }

  sincronizarUnLote(): void {
    this.resultMsg.set(null);
    const id = this.loteId() ?? this.lotes()[0]?.id;
    if (!id) return;

    this.weather.sincronizar(id).subscribe({
      next: () => this.onSyncSuccess(),
    });
  }

  private sincronizarTodos(): void {
    this.resultMsg.set(null);
    if (!this.lotes().length) return;

    this.weather.sincronizarTodos().subscribe({
      next: () => this.onSyncSuccess(),
    });
  }

  private onSyncSuccess(): void {
    const last = this.weather.lastSync();
    if (!last) return;

    const s = last.sincronizacion;
    if (s.todos_lotes && s.lotes_procesados != null) {
      this.resultMsg.set(
        `Listo: ${s.lotes_procesados} lotes, ` +
          `${s.total_sensores_actualizados ?? 0} sensores y ` +
          `${s.total_alertas_generadas ?? 0} alertas actualizadas.`
      );
    } else if (s.lote_nombre) {
      this.resultMsg.set(
        `Listo: ${s.sensores_actualizados} sensores y ` +
          `${s.alertas_generadas} alertas en "${s.lote_nombre}".`
      );
    }
    setTimeout(() => this.finalizar(), CERRAR_MODAL_MS);
  }

  continuar(): void {
    if (this.skipFuture()) {
      this.prompt.skipAlwaysOnLogin();
    } else {
      this.prompt.close();
    }
  }

  private finalizar(): void {
    if (this.skipFuture()) {
      this.prompt.skipAlwaysOnLogin();
    } else {
      this.prompt.close();
    }
  }
}
