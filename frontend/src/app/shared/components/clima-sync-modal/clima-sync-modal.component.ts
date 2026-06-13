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
  templateUrl: './clima-sync-modal.component.html',
  styleUrl: './clima-sync-modal.component.scss',
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
