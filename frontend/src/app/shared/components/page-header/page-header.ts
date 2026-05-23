import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html'
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string | null>(null);
}
