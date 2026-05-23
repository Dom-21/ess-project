import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.html'
})
export class FormFieldComponent {
  label = input.required<string>();
  id = input.required<string>();
  required = input<boolean>(false);
  error = input<string | null | boolean>(null);
}
