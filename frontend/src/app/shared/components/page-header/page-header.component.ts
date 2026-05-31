import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header">
      <div class="page-header__text">
        <h2>{{ title() }}</h2>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      @if (showAction()) {
        <button type="button" class="btn btn--primary page-header__btn" (click)="actionClick.emit()">
          + {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input('');
  actionLabel = input('Nuevo');
  showAction = input(true);
  actionClick = output<void>();
}
