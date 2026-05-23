import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PortalService } from '../../core/services/portal.service';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { FormFieldComponent } from '../../shared/components/form-field/form-field';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { SubmitBtnComponent } from '../../shared/components/submit-btn/submit-btn';

@Component({
  selector: 'app-expense',
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
  templateUrl: './expense.html'
})
export class ExpenseComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  expenses = signal<any[]>([]);
  loadingSubmit = signal<boolean>(false);
  expenseForm: FormGroup;

  isFieldInvalid(field: string): boolean {
    const control = this.expenseForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  constructor() {
    this.expenseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      claimDate: ['', Validators.required],
      description: [''],
      items: this.fb.array([this.createItem()])
    });
  }

  get itemsArray(): FormArray {
    return this.expenseForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      categoryId: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      expenseDate: ['', Validators.required]
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  totalAmount(): number {
    return this.itemsArray.controls.reduce((sum, ctrl) => {
      const amt = parseFloat(ctrl.get('amount')?.value) || 0;
      return sum + amt;
    }, 0);
  }

  ngOnInit(): void {
    this.loadExpenses();
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.patchValue({ claimDate: today });
    this.itemsArray.controls.forEach(ctrl => ctrl.patchValue({ expenseDate: today }));
  }

  loadExpenses(): void {
    this.portalService.getExpenseRequests().subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.expenses.set(res.content);
        } else if (Array.isArray(res)) {
          this.expenses.set(res);
        } else {
          this.expenses.set([]);
        }
      },
      error: (err) => console.error('Failed to load expense claims', err)
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) return;

    this.loadingSubmit.set(true);

    // Ensure categoryId is sent as integer
    const formValue = this.expenseForm.value;
    const payload = {
      ...formValue,
      items: formValue.items.map((item: any) => ({
        ...item,
        categoryId: parseInt(item.categoryId, 10)
      }))
    };

    this.portalService.submitExpenseRequest(payload).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        // Reset form with one blank item
        while (this.itemsArray.length > 1) {
          this.itemsArray.removeAt(1);
        }
        this.itemsArray.at(0).reset();
        this.expenseForm.patchValue({ title: '', description: '' });
        const today = new Date().toISOString().split('T')[0];
        this.expenseForm.patchValue({ claimDate: today });
        this.itemsArray.controls.forEach(ctrl => ctrl.patchValue({ expenseDate: today }));
        this.loadExpenses();
      },
      error: (err) => {
        console.error('Failed to submit expense claim', err);
        this.loadingSubmit.set(false);
      }
    });
  }

  cancelRequest(id: number): void {
    if (!confirm('Are you sure you want to cancel this expense claim?')) return;

    this.portalService.cancelExpenseRequest(id).subscribe({
      next: () => this.loadExpenses(),
      error: (err) => console.error('Failed to cancel expense request', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED':  return 'bg-success-500/10 text-success-500 border-success-500/15';
      case 'REJECTED':  return 'bg-danger-500/10 text-danger-500 border-danger-500/15';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
      case 'PENDING':   return 'bg-warning-500/10 text-warning-600 border-warning-500/15';
      default:          return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
    }
  }
}
