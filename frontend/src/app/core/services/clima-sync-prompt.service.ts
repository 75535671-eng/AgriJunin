import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const SESSION_KEY = 'agri_show_clima_sync';
const SKIP_KEY = 'agri_skip_clima_sync_on_login';

@Injectable({ providedIn: 'root' })
export class ClimaSyncPromptService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly visible = signal(false);

  private get browser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readonly isVisible = this.visible.asReadonly();

  markShowAfterLogin(): void {
    if (!this.browser) return;
    if (localStorage.getItem(SKIP_KEY) === '1') return;
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  shouldOpenOnLayout(): boolean {
    if (!this.browser) return false;
    if (localStorage.getItem(SKIP_KEY) === '1') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    if (this.browser) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    this.visible.set(false);
  }

  skipAlwaysOnLogin(): void {
    if (this.browser) {
      localStorage.setItem(SKIP_KEY, '1');
      sessionStorage.removeItem(SESSION_KEY);
    }
    this.visible.set(false);
  }

  resetSkipPreference(): void {
    if (this.browser) {
      localStorage.removeItem(SKIP_KEY);
    }
  }
}
