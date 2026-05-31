import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LotesStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-lotes-list',
  imports: [PageHeaderComponent, RouterLink],
  providers: [LotesStore],
  template: `
    <app-page-header title="Lotes agrícolas" subtitle="Parcelas y ubicaciones"
      [showAction]="auth.canEdit()" (actionClick)="router.navigate(['/lotes/nuevo'])" />
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Código</th><th>Nombre</th><th>Agricultor</th><th>Cultivo</th><th>Área</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          @for (l of store.items(); track l.id) {
            <tr>
              <td>{{ l.codigo_lote }}</td>
              <td>{{ l.nombre }}</td>
              <td>{{ l.agricultor_nombres }} {{ l.agricultor_apellidos }}</td>
              <td>{{ l.cultivo_nombre || '—' }}</td>
              <td>{{ l.area_hectareas }} ha</td>
              <td><span class="badge badge--info">{{ l.estado }}</span></td>
              <td class="actions">
                @if (auth.canEdit()) { <a [routerLink]="['/lotes', l.id, 'editar']" class="btn btn--outline btn--sm">Editar</a> }
                @if (auth.isAdmin()) { <button class="btn btn--danger btn--sm" (click)="del(l.id!)">Eliminar</button> }
              </td>
            </tr>
          } @empty { <tr><td colspan="7" class="empty">Sin lotes</td></tr> }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: '../agricultores/crud-list.scss',
})
export class LotesListComponent implements OnInit {
  protected readonly store = inject(LotesStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  ngOnInit(): void { this.store.refresh(); }
  del(id: number): void {
    if (confirm('¿Eliminar lote?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
