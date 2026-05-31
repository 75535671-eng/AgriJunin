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
    this.weather.sincronizar(this.loteSeleccionado());
    const check = setInterval(() => {
      if (!this.weather.syncing()) {
        clearInterval(check);
        const last = this.weather.lastSync();
        if (last) {
          this.syncMessage.set(
            `✓ Sincronizado en "${last.sincronizacion.lote_nombre}": ` +
            `${last.sincronizacion.sensores_actualizados} sensores, ` +
            `${last.sincronizacion.alertas_generadas} alertas. ` +
            `Registro #${last.sincronizacion.registro_id}.`
          );
        }
      }
    }, 200);
  }

  barTemp(temp: number): string {
    return `${(temp / this.maxTempHoraria()) * 100}%`;
  }
}
