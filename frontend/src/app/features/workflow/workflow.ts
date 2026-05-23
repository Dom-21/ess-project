import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PortalService } from '../../core/services/portal.service';

interface ExpandedDetails {
  [taskId: number]: {
    loading: boolean;
    data?: any;
    error?: string;
  };
}

import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    PageHeaderComponent
  ],
  templateUrl: './workflow.html'
})
export class WorkflowComponent implements OnInit {
  private readonly portalService = inject(PortalService);

  tasks = signal<any[]>([]);
  expandedTaskIds = signal<number[]>([]);
  
  private readonly _expandedDetails = signal<ExpandedDetails>({});
  get expandedDetails() {
    return this._expandedDetails();
  }
  
  remarksMap: { [taskId: number]: string } = {};
  loadingAction: { [taskId: number]: boolean } = {};

  ngOnInit(): void {
    this.loadPendingTasks();
  }

  loadPendingTasks(): void {
    this.portalService.getPendingWorkflowTasks().subscribe({
      next: (res) => this.tasks.set(res),
      error: (err) => console.error('Failed to load pending workflow inbox', err)
    });
  }

  isExpanded(taskId: number): boolean {
    return this.expandedTaskIds().includes(taskId);
  }

  toggleDetails(task: any): void {
    const id = task.id;
    if (this.isExpanded(id)) {
      this.expandedTaskIds.update(ids => ids.filter(x => x !== id));
    } else {
      this.expandedTaskIds.update(ids => [...ids, id]);
      
      // Check if we already loaded it or need to load it dynamically
      if (!this.expandedDetails[id]) {
        this._expandedDetails.update(details => ({
          ...details,
          [id]: { loading: true }
        }));
        this.loadDetails(task);
      }
    }
  }

  loadDetails(task: any): void {
    const id = task.id;
    const entityType = task.workflowInstance?.workflowConfig?.entityType?.toUpperCase();
    const entityId = task.workflowInstance?.entityId;

    let obs$;
    if (entityType === 'LEAVE') {
      obs$ = this.portalService.getLeaveById(entityId);
    } else if (entityType === 'TRAVEL') {
      obs$ = this.portalService.getTravelById(entityId);
    } else if (entityType === 'EXPENSE') {
      obs$ = this.portalService.getExpenseById(entityId);
    } else if (entityType === 'ASSET') {
      obs$ = this.portalService.getAssetById(entityId);
    }

    if (obs$) {
      obs$.subscribe({
        next: (res) => {
          this._expandedDetails.update(details => ({
            ...details,
            [id]: {
              loading: false,
              data: res
            }
          }));
        },
        error: (err) => {
          console.error(`Failed to load details for ${entityType} request #${entityId}`, err);
          this._expandedDetails.update(details => ({
            ...details,
            [id]: {
              loading: false,
              error: 'Failed to retrieve claim parameters. Check system connectivity.'
            }
          }));
        }
      });
    } else {
      this._expandedDetails.update(details => ({
        ...details,
        [id]: {
          loading: false,
          data: { id: entityId, info: 'Details display unavailable for this entity type.' }
        }
      }));
    }
  }

  actionTask(task: any, action: 'APPROVE' | 'REJECT'): void {
    const id = task.id;
    const remarks = this.remarksMap[id] || '';

    if (action === 'REJECT' && (!remarks || remarks.trim().length < 5)) {
      alert('Remarks of at least 5 characters are required for rejection.');
      return;
    }

    this.loadingAction[id] = true;
    
    this.portalService.processWorkflowTask(id, action, remarks).subscribe({
      next: () => {
        this.loadingAction[id] = false;
        // Clean up expanded maps
        this.expandedTaskIds.update(ids => ids.filter(x => x !== id));
        this._expandedDetails.update(details => {
          const next = { ...details };
          delete next[id];
          return next;
        });
        delete this.remarksMap[id];
        
        // Reload pending queue
        this.loadPendingTasks();
      },
      error: (err) => {
        this.loadingAction[id] = false;
        console.error(`Failed to process action ${action} on task ${id}`, err);
        alert(err?.error?.message || 'Error occurred while saving your assessment action.');
      }
    });
  }

  getTypeIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'LEAVE':
        return 'pi pi-sign-out';
      case 'TRAVEL':
        return 'pi pi-map';
      case 'EXPENSE':
        return 'pi pi-receipt';
      case 'ASSET':
        return 'pi pi-desktop';
      default:
        return 'pi pi-inbox';
    }
  }

  getTypeIconClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'LEAVE':
        return 'bg-success-500/10 text-success-500 border border-success-500/15';
      case 'TRAVEL':
        return 'bg-accent-500/10 text-accent-500 border border-accent-500/15';
      case 'EXPENSE':
        return 'bg-warning-500/10 text-warning-500 border border-warning-500/15';
      case 'ASSET':
        return 'bg-primary-500/10 text-primary-500 border border-primary-500/15';
      default:
        return 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-800';
    }
  }

  getTypeLabelClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'LEAVE':
        return 'text-success-500 border-success-500/15 dark:bg-success-500/5';
      case 'TRAVEL':
        return 'text-accent-500 border-accent-500/15 dark:bg-accent-500/5';
      case 'EXPENSE':
        return 'text-warning-600 border-warning-500/15 dark:bg-warning-500/5';
      case 'ASSET':
        return 'text-primary-500 border-primary-500/15 dark:bg-primary-500/5';
      default:
        return 'text-slate-500 border-slate-200 dark:border-slate-800 dark:bg-slate-800';
    }
  }
}
