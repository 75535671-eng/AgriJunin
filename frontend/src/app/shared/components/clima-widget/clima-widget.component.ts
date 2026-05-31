import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ClimaHuancayo } from '../../../models';

@Component({
  selector: 'app-clima-widget',
  imports: [DatePipe, DecimalPipe],
  template: `
    @if (clima(); as c) {
      <div class="clima-widget">
        <div class="clima-widget__main">
          <span class="clima-widget__temp">{{ c.actual.temperatura | number:'1.1-1' }}°C</span>
          <div>
            <strong>{{ c.ubicacion.ciudad }}, {{ c.ubicacion.region }}</strong>
            <p>{{ c.actual.descripcion }}</p>
            <small>Actualizado: {{ c.ubicacion.actualizado | date:'short' }}</small>
          </div>
        </div>
        <div class="clima-widget__stats">
          <div><span>💧</span><strong>{{ c.actual.humedad }}%</strong><small>Humedad</small></div>
          <div><span>🌧️</span><strong>{{ c.actual.precipitacion }} mm</strong><small>Lluvia</small></div>
          <div><span>💨</span><strong>{{ c.actual.viento_kmh }} km/h</strong><small>Viento</small></div>
          @if (c.actual.humedad_suelo_estimada != null) {
            <div><span>🌱</span><strong>{{ (c.actual.humedad_suelo_estimada * 100) | number:'1.0-0' }}%</strong><small>Suelo est.</small></div>
          }
        </div>
        <footer class="clima-widget__footer">
          Fuente: <a href="https://open-meteo.com/" target="_blank" rel="noopener">{{ c.fuente }}</a> ({{ c.licencia }})
        </footer>
      </div>
    }
  `,
  styles: [`
    .clima-widget {
      background: linear-gradient(135deg, #1b4332 0%, #40916c 100%);
      color: white;
      border-radius: var(--radius);
      padding: 1.25rem;
    }
    .clima-widget__main {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .clima-widget__temp {
      font-size: clamp(2rem, 8vw, 2.5rem);
      font-weight: 700;
      line-height: 1;
      flex-shrink: 0;
    }
    .clima-widget__main > div { min-width: 0; }
    @media (max-width: 480px) {
      .clima-widget__main {
        flex-direction: column;
        text-align: center;
      }
      .clima-widget__stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .clima-widget__main p { opacity: 0.9; font-size: 0.95rem; }
    .clima-widget__main small { opacity: 0.75; font-size: 0.75rem; }
    .clima-widget__stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 0.75rem;
      text-align: center;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    .clima-widget__stats strong { display: block; font-size: 1rem; }
    .clima-widget__stats small { opacity: 0.8; font-size: 0.7rem; }
    .clima-widget__footer {
      font-size: 0.7rem;
      opacity: 0.8;
      margin-top: 0.5rem;
      a { color: #d8f3dc; }
    }
  `],
})
export class ClimaWidgetComponent {
  clima = input<ClimaHuancayo | null | undefined>(null);
}
