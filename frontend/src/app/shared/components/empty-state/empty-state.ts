import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.html'
})
export class EmptyStateComponent {
  icon = input<string>('pi pi-inbox');
  message = input.required<string>();
}
