import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RegistrosStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-registros-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink],
  providers: [RegistrosStore],
  template: `
    <app-page-header title="Registros agrícolas" subtitle="Monitoreo ambiental y producción"
      actionLabel="Nuevo registro" [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/registros/nuevo'])" />
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Lote</th><th>Cultivo</th><th>Temp °C</th><th>Humedad %</th><th>pH</th><th>Producción kg</th><th>Acciones</th></tr></thead>
        <tbody>
          @for (r of store.items(); track r.id) {
            <tr>
              <td>{{ r.fecha_registro | date:'short' }}</td>
              <td>{{ r.lote_nombre }}</td>
              <td>{{ r.cultivo_nombre }}</td>
              <td>{{ r.temperatura ?? '—' }}</td>
              <td>{{ r.humedad_suelo ?? '—' }}</td>
              <td>{{ r.ph_suelo ?? '—' }}</td>
              <td>{{ r.produccion_kg ?? '—' }}</td>
              <td class="actions">
                @if (auth.canEdit()) { <a [routerLink]="['/registros', r.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(r.id!)">Eliminar</button> }
              </td>
            </tr>
          } @empty { <tr><td colspan="8" class="empty">Sin registros</td></tr> }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class RegistrosListComponent implements OnInit {
  protected readonly store = inject(RegistrosStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  ngOnInit(): void { this.store.refresh(); }
  del(id: number): void {
    if (confirm('¿Eliminar registro?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
