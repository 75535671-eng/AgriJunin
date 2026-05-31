import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="stat-card" [style.--accent-color]="color()">
      <div class="stat-card__icon">{{ icon() }}</div>
      <div class="stat-card__body">
        <span class="stat-card__label">{{ label() }}</span>
        <strong class="stat-card__value">{{ value() }}</strong>
        @if (subtitle()) {
          <small class="stat-card__sub">{{ subtitle() }}</small>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent-color, var(--primary));
    }
    .stat-card__icon { font-size: 2rem; }
    .stat-card__label { display: block; font-size: 0.8rem; color: var(--text-muted); }
    .stat-card__value { font-size: 1.75rem; color: var(--primary-dark); }
    .stat-card__sub { color: var(--text-muted); font-size: 0.75rem; }
  `],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input('📊');
  subtitle = input('');
  color = input('var(--primary)');
}
