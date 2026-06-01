import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WeatherService } from '../../services/weather.service';
import { ClimaWidgetComponent } from '../../shared/components/clima-widget/clima-widget.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { LookupService } from '../../services/lookup.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clima-huancayo',
  imports: [ClimaWidgetComponent, DatePipe, DecimalPipe, RouterLink, FormsModule],
  templateUrl: './clima-huancayo.component.html',
  styleUrl: './clima-huancayo.component.scss',
})
export class ClimaHuancayoComponent implements OnInit {
  protected readonly weather = inject(WeatherService);
  protected readonly auth = inject(AuthStateService);
  protected readonly lookup = inject(LookupService);

  protected readonly loteSeleccionado = signal<number | undefined>(undefined);
  protected readonly syncMessage = signal<string | null>(null);

  protected readonly isStaff = computed(() => this.auth.isAdmin() || this.auth.isTecnico());

  readonly maxTempHoraria = computed(() => {
    const h = this.weather.clima()?.pronosticoHorario ?? [];
    return Math.max(...h.map((x) => x.temperatura), 1);
  });

  ngOnInit(): void {
    this.weather.load();
    this.lookup.loadLotes();
  }

  refresh(): void {
    this.syncMessage.set(null);
    this.weather.load();
  }

  sincronizar(): void {
    this.syncMessage.set(null);
    const sync$ =
      this.isStaff() && !this.loteSeleccionado()
        ? this.weather.sincronizarTodos()
        : this.weather.sincronizar(this.loteSeleccionado());

    sync$.subscribe({
      next: () => {
        const last = this.weather.lastSync();
        if (!last) return;
        const s = last.sincronizacion;
        if (s.todos_lotes && s.lotes_procesados != null) {
          this.syncMessage.set(
            `✓ Sincronizados ${s.lotes_procesados} lotes: ` +
              `${s.total_sensores_actualizados ?? 0} sensores, ` +
              `${s.total_alertas_generadas ?? 0} alertas.`
          );
        } else if (s.lote_nombre) {
          this.syncMessage.set(
            `✓ Sincronizado en "${s.lote_nombre}": ` +
              `${s.sensores_actualizados} sensores, ` +
              `${s.alertas_generadas} alertas. ` +
              `Registro #${s.registro_id}.`
          );
        }
      },
    });
  }

  barTemp(temp: number): string {
    return `${(temp / this.maxTempHoraria()) * 100}%`;
  }
}
