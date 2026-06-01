import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ClimaSyncPromptService } from '../../core/services/clima-sync-prompt.service';
import { ClimaSyncModalComponent } from '../../shared/components/clima-sync-modal/clima-sync-modal.component';
import { NAV_SECTIONS, NavItemConfig, NavSectionConfig } from '../../core/config/role-permissions';
import { Rol } from '../../models';

const DESKTOP_BP = 992;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClimaSyncModalComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly auth = inject(AuthStateService);
  private readonly climaPrompt = inject(ClimaSyncPromptService);

  protected readonly sidebarOpen = signal(true);
  protected readonly isOverlay = signal(false);

  private resizeHandler?: () => void;

  protected readonly navSections = computed(() => {
    const rol = this.auth.userRole() as Rol | null;
    if (!rol) return [];
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(rol)),
    })).filter((section) => section.items.length > 0);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.resizeHandler = () => this.applyViewport();
    this.applyViewport();
    window.addEventListener('resize', this.resizeHandler);

    if (this.climaPrompt.shouldOpenOnLayout()) {
      this.climaPrompt.open();
    }
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

  canSeeItem(item: NavItemConfig): boolean {
    const rol = this.auth.userRole();
    return !!rol && item.roles.includes(rol as Rol);
  }

  canSeeSection(section: NavSectionConfig & { items: NavItemConfig[] }): boolean {
    return section.items.some((item) => this.canSeeItem(item));
  }

  logout(): void {
    this.auth.logout();
  }
}
