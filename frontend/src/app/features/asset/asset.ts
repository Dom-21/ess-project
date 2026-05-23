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
  selector: 'app-asset',
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
  templateUrl: './asset.html'
})
export class AssetComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  availableAssets = signal<any[]>([]);
  requests = signal<any[]>([]);
  
  loadingSubmit = signal<boolean>(false);
  assetForm: FormGroup;

  isFieldInvalid(field: string): boolean {
    const control = this.assetForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  constructor() {
    this.assetForm = this.fb.group({
      assetId: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(5)]],
      additionalNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableAssets();
    this.loadRequests();
  }

  loadAvailableAssets(): void {
    this.portalService.getAvailableAssets().subscribe({
      next: (res) => this.availableAssets.set(res),
      error: (err) => console.error('Failed to load available assets', err)
    });
  }

  loadRequests(): void {
    this.portalService.getAssetRequests().subscribe({
      next: (res) => {
        // Since getAssetRequests() returns a PagedResponse, we handle it
        if (res && res.content) {
          this.requests.set(res.content);
        } else if (Array.isArray(res)) {
          this.requests.set(res);
        } else {
          this.requests.set([]);
        }
      },
      error: (err) => console.error('Failed to load asset requests', err)
    });
  }

  selectAsset(asset: any): void {
    this.assetForm.patchValue({
      assetId: asset.id
    });
    // Scroll to form smoothly
    const formElement = document.getElementById('assetId');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      formElement.focus();
    }
  }

  onSubmit(): void {
    if (this.assetForm.invalid) return;

    this.loadingSubmit.set(true);
    
    this.portalService.submitAssetRequest(this.assetForm.value).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.assetForm.reset({ assetId: '' });
        this.loadAvailableAssets();
        this.loadRequests();
      },
      error: (err) => {
        console.error('Failed to request asset', err);
        this.loadingSubmit.set(false);
      }
    });
  }

  returnAsset(id: number): void {
    if (!confirm('Are you sure you want to return this asset?')) return;

    this.portalService.cancelAssetRequest(id).subscribe({
      next: () => {
        this.loadAvailableAssets();
        this.loadRequests();
      },
      error: (err) => console.error('Failed to return asset', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-success-500/10 text-success-500 border-success-500/15';
      case 'REJECTED':
        return 'bg-danger-500/10 text-danger-500 border-danger-500/15';
      case 'RETURNED':
        return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
      case 'PENDING':
        return 'bg-warning-500/10 text-warning-600 border-warning-500/15';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800';
    }
  }
}
