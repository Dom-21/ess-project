import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-submit-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submit-btn.html'
})
export class SubmitBtnComponent {
  loading = input<boolean>(false);
  label = input.required<string>();
  loadingLabel = input<string>('Submitting...');
  icon = input<string | null>(null);
  disabled = input<boolean>(false);
}
