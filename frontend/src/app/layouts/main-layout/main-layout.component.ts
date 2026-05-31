import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const DESKTOP_BP = 992;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly auth = inject(AuthStateService);

  protected readonly sidebarOpen = signal(true);
  protected readonly isOverlay = signal(false);

  private resizeHandler?: () => void;

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Clima Huancayo', path: '/clima', icon: '🌤️' },
    { label: 'Agricultores', path: '/agricultores', icon: '👨‍🌾' },
    { label: 'Cultivos', path: '/cultivos', icon: '🌱' },
    { label: 'Lotes', path: '/lotes', icon: '🗺️' },
    { label: 'Sensores', path: '/sensores', icon: '📡' },
    { label: 'Registros', path: '/registros', icon: '📋' },
    { label: 'Alertas', path: '/alertas', icon: '🔔' },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.resizeHandler = () => this.applyViewport();
    this.applyViewport();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.resizeHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private applyViewport(): void {
    const overlay = window.innerWidth < DESKTOP_BP;
    this.isOverlay.set(overlay);
    if (overlay) {
      this.sidebarOpen.set(false);
    } else {
      this.sidebarOpen.set(true);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  closeSidebarOnNavigate(): void {
    if (this.isOverlay()) this.closeSidebar();
  }

  canSee(_item: NavItem): boolean {
    return true;
  }

  logout(): void {
    this.auth.logout();
  }
}
