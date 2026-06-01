import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AlertasStore } from '../../services/entity.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthStateService } from '../../core/services/auth-state.service';
import { RelationBannerComponent } from '../../shared/components/relation-banner/relation-banner.component';

@Component({
  selector: 'app-alertas-list',
  imports: [PageHeaderComponent, DatePipe, RouterLink, RelationBannerComponent],
  providers: [AlertasStore],
  templateUrl: './alertas-list.component.html',
  styleUrl: './alertas-list.component.scss',
})
export class AlertasListComponent implements OnInit {
  protected readonly store = inject(AlertasStore);
  protected readonly auth = inject(AuthStateService);
  protected readonly router = inject(Router);
  ngOnInit(): void { this.store.refresh(); }
  del(id: number): void {
    if (confirm('¿Eliminar alerta?')) this.store.remove(id).subscribe(() => this.store.refresh());
  }
}
