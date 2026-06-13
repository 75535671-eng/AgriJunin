import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ClimaHuancayo } from '../../../models';

@Component({
  selector: 'app-clima-widget',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './clima-widget.component.html',
  styleUrl: './clima-widget.component.scss',
})
export class ClimaWidgetComponent {
  clima = input<ClimaHuancayo | null | undefined>(null);
}
