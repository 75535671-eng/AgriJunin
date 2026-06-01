import { Component, inject, OnInit, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { ClimaWidgetComponent } from '../shared/components/clima-widget/clima-widget.component';
import { DashboardService } from '../services/dashboard.service';
import { AuthStateService } from '../core/services/auth-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [StatCardComponent, ClimaWidgetComponent, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dash = inject(DashboardService);
  protected readonly auth = inject(AuthStateService);

  readonly stats = this.dash.stats;
  readonly loading = this.dash.loading;

  readonly maxProduccion = computed(() => {
    const data = this.stats()?.produccionSemanal ?? [];
    return Math.max(...data.map((d) => Number(d.produccion)), 1);
  });

  readonly showKpiAgricultores = computed(() => this.auth.isAdmin() || this.auth.isTecnico());

  ngOnInit(): void {
    this.dash.load();
  }

  barHeight(produccion: number): string {
    const max = this.maxProduccion();
    return `${(Number(produccion) / max) * 100}%`;
  }

  nivelClass(nivel: string): string {
    const map: Record<string, string> = {
      critica: 'badge--danger',
      advertencia: 'badge--warning',
      info: 'badge--info',
    };
    return map[nivel] || 'badge--info';
  }
}
