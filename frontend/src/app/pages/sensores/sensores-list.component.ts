import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SensoresStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-sensores-list',
  imports: [PageHeaderComponent, RouterLink],
  providers: [SensoresStore],
  template: `
    <app-page-header title="Sensores IoT" subtitle="Monitoreo ambiental en tiempo real"
      actionLabel="Nuevo sensor" [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/sensores/nuevo'])" />
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Código</th><th>Nombre</th><th>Lote</th><th>Tipo</th><th>Última lectura</th><th>Estado</th><th>Batería</th><th>Acciones</th></tr></thead>
        <tbody>
          @for (s of store.items(); track s.id) {
            <tr>
              <td>{{ s.codigo_sensor }}</td>
              <td>{{ s.nombre }}</td>
              <td>{{ s.lote_nombre }}</td>
              <td>{{ s.tipo }}</td>
              <td>{{ s.ultima_lectura }} {{ s.unidad_medida }}</td>
              <td><span class="badge" [class.badge--success]="s.estado==='activo'" [class.badge--warning]="s.estado==='mantenimiento'">{{ s.estado }}</span></td>
              <td>{{ s.bateria_pct }}%</td>
              <td class="actions">
                @if (auth.canEdit()) { <a [routerLink]="['/sensores', s.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(s.id!)">Eliminar</button> }
              </td>
            </tr>
          } @empty { <tr><td colspan="8" class="empty">Sin sensores</td></tr> }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class SensoresListComponent implements OnInit {
  protected readonly store = inject(SensoresStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  ngOnInit(): void { this.store.refresh(); }
  del(id: number): void {
    if (confirm('¿Eliminar sensor?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
