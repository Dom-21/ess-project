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
  selector: 'app-leave',
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
  templateUrl: './leave.html'
})
export class LeaveComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  balances = signal<any[]>([]);
  requests = signal<any[]>([]);
  
  loadingSubmit = signal<boolean>(false);
  leaveForm: FormGroup;

  isFieldInvalid(field: string): boolean {
    const control = this.leaveForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  constructor() {
    this.leaveForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadBalances();
    this.loadRequests();
  }

  loadBalances(): void {
    this.portalService.getLeaveBalances().subscribe({
      next: (res) => this.balances.set(res),
      error: (err) => console.error('Failed to load leave balances', err)
    });
  }

  loadRequests(): void {
    this.portalService.getLeaveRequests().subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.requests.set(res.content);
        } else if (Array.isArray(res)) {
          this.requests.set(res);
        } else {
          this.requests.set([]);
        }
      },
      error: (err) => console.error('Failed to load leave requests', err)
    });
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) return;

    this.loadingSubmit.set(true);
    
    this.portalService.submitLeaveRequest(this.leaveForm.value).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.leaveForm.reset({ leaveTypeId: '' });
        this.loadBalances();
        this.loadRequests();
      },
      error: (err) => {
        console.error('Failed to request leave', err);
        this.loadingSubmit.set(false);
      }
    });
  }

  cancelRequest(id: number): void {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;

    this.portalService.cancelLeaveRequest(id).subscribe({
      next: () => {
        this.loadBalances();
        this.loadRequests();
      },
      error: (err) => console.error('Failed to cancel leave request', err)
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
