import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input('');
  actionLabel = input('Nuevo');
  showAction = input(true);
  actionClick = output<void>();
}
