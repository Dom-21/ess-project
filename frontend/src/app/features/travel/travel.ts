import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PortalService } from '../../core/services/portal.service';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { FormFieldComponent } from '../../shared/components/form-field/form-field';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { SubmitBtnComponent } from '../../shared/components/submit-btn/submit-btn';

@Component({
  selector: 'app-travel',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FormFieldComponent,
    EmptyStateComponent,
    SubmitBtnComponent
  ],
  templateUrl: './travel.html'
})
export class TravelComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  trips = signal<any[]>([]);
  loadingSubmit = signal<boolean>(false);
  travelForm: FormGroup;

  isFieldInvalid(field: string): boolean {
    const control = this.travelForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  constructor() {
    this.travelForm = this.fb.group({
      purpose: ['', [Validators.required, Validators.minLength(5)]],
      destination: ['', [Validators.required, Validators.minLength(3)]],
      travelDate: ['', Validators.required],
      returnDate: ['', Validators.required],
      modeOfTransport: ['', Validators.required],
      estimatedCost: [0, [Validators.required, Validators.min(0)]],
      additionalNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.portalService.getTravelRequests().subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.trips.set(res.content);
        } else if (Array.isArray(res)) {
          this.trips.set(res);
        } else {
          this.trips.set([]);
        }
      },
      error: (err) => console.error('Failed to load travel requests', err)
    });
  }

  onSubmit(): void {
    if (this.travelForm.invalid) return;

    this.loadingSubmit.set(true);
    
    this.portalService.submitTravelRequest(this.travelForm.value).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.travelForm.reset({ modeOfTransport: '', estimatedCost: 0, additionalNotes: '' });
        this.loadTrips();
      },
      error: (err) => {
        console.error('Failed to request travel', err);
        this.loadingSubmit.set(false);
      }
    });
  }

  cancelRequest(id: number): void {
    if (!confirm('Are you sure you want to cancel this trip request?')) return;

    this.portalService.cancelTravelRequest(id).subscribe({
      next: () => {
        this.loadTrips();
      },
      error: (err) => console.error('Failed to cancel travel request', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-success-500/10 text-success-500 border-success-500/15';
      case 'REJECTED':
        return 'bg-danger-500/10 text-danger-500 border-danger-500/15';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
      case 'PENDING':
        return 'bg-warning-500/10 text-warning-600 border-warning-500/15';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
    }
  }
}
