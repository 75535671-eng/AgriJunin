import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-relation-banner',
  imports: [RouterLink],
  templateUrl: './relation-banner.component.html',
  styleUrl: './relation-banner.component.scss',
})
export class RelationBannerComponent {
  readonly title = input('Relación del sistema');
  readonly hint = input<string | undefined>(undefined);
}
