import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgricultoresStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';

@Component({
  selector: 'app-agricultores-list',
  imports: [PageHeaderComponent, RouterLink, DatePipe, FormsModule, RelationBannerComponent],
  providers: [AgricultoresStore],
  templateUrl: './agricultores-list.component.html',
  styleUrl: './crud-list.scss',
})
export class AgricultoresListComponent implements OnInit {
  protected readonly store = inject(AgricultoresStore);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStateService);
  protected readonly searchTerm = signal('');

  ngOnInit(): void {
    this.store.refresh();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.store.setSearch(term);
    this.store.refresh();
  }

  deleteItem(id: number): void {
    if (!confirm('¿Eliminar este agricultor?')) return;
    this.store.remove(id).subscribe(() => this.store.refresh());
  }

  goNew(): void {
    this.router.navigate(['/agricultores/nuevo']);
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      preparacion: 'Preparación',
      siembra: 'Siembra',
      crecimiento: 'Crecimiento',
      cosecha: 'Cosecha',
      barbecho: 'Barbecho',
    };
    return labels[estado] || estado;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      preparacion: 'badge--info',
      siembra: 'badge--warning',
      crecimiento: 'badge--success',
      cosecha: 'badge--success',
      barbecho: 'badge--info',
    };
    return map[estado] || 'badge--info';
  }
}
