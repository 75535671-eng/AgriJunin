import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { RegistrosStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-registros-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent],
  providers: [RegistrosStore],
  templateUrl: './registros-list.component.html',
  styleUrls: ['./registros-list.component.scss', '../agricultores/crud-list.scss'],
})
export class RegistrosListComponent implements OnInit {
  protected readonly store = inject(RegistrosStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly filterLoteId = signal<number | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const loteId = params.get('lote_id');
      this.filterLoteId.set(loteId ? +loteId : null);
      if (loteId) {
        this.store.setFilters({ lote_id: +loteId });
      } else {
        this.store.clearFilters();
      }
      this.store.refresh();
    });
  }

  del(id: number): void {
    if (confirm('¿Eliminar registro?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
