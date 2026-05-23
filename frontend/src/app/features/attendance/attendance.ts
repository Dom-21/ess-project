import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PortalService } from '../../core/services/portal.service';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { FormFieldComponent } from '../../shared/components/form-field/form-field';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { SubmitBtnComponent } from '../../shared/components/submit-btn/submit-btn';

@Component({
  selector: 'app-attendance',
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
  templateUrl: './attendance.html'
})
export class AttendanceComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  attendanceLogs = signal<any[]>([]);
  currentPage = signal<number>(0);
  pageSize = 10;

  loadingReg = signal<boolean>(false);
  regularizeForm: FormGroup;

  isFieldInvalid(field: string): boolean {
    const control = this.regularizeForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  constructor() {
    this.regularizeForm = this.fb.group({
      date: ['', Validators.required],
      checkIn: ['09:00', Validators.required],
      checkOut: ['18:00', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  logsForm = new FormGroup({
    from: new FormControl<string | null>(null, Validators.required),
    to: new FormControl<string | null>(null, Validators.required),
  })

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    const today = new Date();

    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const from =
      this.logsForm.get('from')?.value ??
      formatDate(firstDayOfMonth);

    const to =
      this.logsForm.get('to')?.value ??
      formatDate(today);
    this.portalService.getAttendanceLogs(this.currentPage(), this.pageSize, from, to).subscribe({
      next: (res) => {
        this.logsForm.setValue({
          from: from,
          to: to
        })
        // If paginated response wraps records inside a content field
        this.attendanceLogs.set(res.content || res);
      },
      error: (err) => console.error('Failed to load attendance logs', err)
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadLogs();
    }
  }

  nextPage(): void {
    this.currentPage.update(p => p + 1);
    this.loadLogs();
  }
  onRegularizeSubmit(): void {
    if (this.regularizeForm.invalid) return;

    this.loadingReg.set(true);
    const formVal = this.regularizeForm.value;
    const regularizationRequest = {
      date: formVal.date,
      checkIn: `${formVal.checkIn}:00`,
      checkOut: `${formVal.checkOut}:00`,
      reason: formVal.reason
    };
    console.log(regularizationRequest);
    this.portalService.submitRegularization(regularizationRequest).subscribe({
      next: () => {
        this.loadingReg.set(false);
        this.regularizeForm.reset({
          checkIn: '09:00',
          checkOut: '18:00'
        });
        this.currentPage.set(0);
        this.loadLogs();
      },
      error: (err) => {
        console.error('Failed to submit regularization', err);
        this.loadingReg.set(false);
      }
    });
  }
}
