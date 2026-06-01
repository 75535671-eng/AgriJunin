import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UsuarioPendiente } from '../../models';

@Component({
  selector: 'app-usuarios-pendientes',
  imports: [PageHeaderComponent, DatePipe],
  template: `
    <app-page-header
      title="Cuentas técnicas pendientes"
      subtitle="Apruebe o rechace solicitudes de registro"
    />
    <div class="card table-wrap">
      @if (loading()) { <p class="loading">Cargando...</p> }
      @else {
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Solicitud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of items(); track u.id) {
              <tr>
                <td>{{ u.dni || '—' }}</td>
                <td>{{ u.nombre }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.created_at | date:'short' }}</td>
                <td class="actions">
                  <button type="button" class="btn btn--primary btn--sm" (click)="aprobar(u)">Aprobar</button>
                  <button type="button" class="btn btn--danger btn--sm" (click)="rechazar(u)">Rechazar</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">No hay solicitudes pendientes</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class UsuariosPendientesComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly items = signal<UsuarioPendiente[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<UsuarioPendiente[]>('usuarios/pendientes').subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  aprobar(u: UsuarioPendiente): void {
    if (!confirm(`¿Aprobar cuenta de técnico para ${u.nombre}?`)) return;
    this.api.patch(`usuarios/${u.id}/aprobar`, {}).subscribe(() => this.load());
  }

  rechazar(u: UsuarioPendiente): void {
    const motivo = prompt('Motivo del rechazo (opcional):') || undefined;
    this.api.patch(`usuarios/${u.id}/rechazar`, { motivo }).subscribe(() => this.load());
  }
}
