import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UsuarioPendiente } from '../../models';

@Component({
  selector: 'app-usuarios-pendientes',
  imports: [PageHeaderComponent, DatePipe],
  templateUrl: './usuarios-pendientes.component.html',
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
