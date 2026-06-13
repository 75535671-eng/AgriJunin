import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input('📊');
  subtitle = input('');
  color = input('var(--primary)');
}
