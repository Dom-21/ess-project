import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html'
})
export class StatusBadgeComponent {
  status = input.required<string>();

  badgeClass = computed(() => {
    const val = this.status()?.toUpperCase() || 'PENDING';
    switch (val) {
      case 'APPROVED':
      case 'PRESENT':
      case 'ACTIVE':
        return 'bg-success-500/10 text-success-500 border-success-500/20';
      case 'REJECTED':
      case 'ABSENT':
        return 'bg-danger-500/10 text-danger-500 border-danger-500/20';
      case 'WEEKEND':
      case 'HOLIDAY':
        return 'bg-primary-500/10 text-primary-500 border-primary-500/20';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-400';
      case 'LATE':
      case 'PENDING':
      default:
        return 'bg-warning-500/10 text-warning-600 border-warning-500/20';
    }
  });
}
