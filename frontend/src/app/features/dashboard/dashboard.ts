import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortalService } from '../../core/services/portal.service';
import { AuthService } from '../../core/services/auth.service';

import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, PageHeaderComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  readonly authService = inject(AuthService);

  currentTime = signal<string>('');
  clockedIn = signal<boolean>(false);
  loadingAttendance = signal<boolean>(false);

  employeeSummary = signal<any>({
    pendingLeaves: 0,
    pendingExpenses: 0,
    pendingTravel: 0,
    pendingAssets: 0
  });

  adminSummary = signal<any>({
    totalEmployees: 0,
    pendingLeaves: 0,
    pendingExpenses: 0,
    pendingTravel: 0,
    pendingAssets: 0,
    unassignedManagerCount: 0,
    unassignedDeptCount: 0,
    recentRequests: [],
    departmentDist: {}
  });

  teamMembers = signal<any[]>([]);

  employeeMetrics = computed(() => [
    {
      title: 'Leaves Pending',
      value: this.employeeSummary().pendingLeaves,
      icon: 'pi pi-sign-out text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-950/20'
    },
    {
      title: 'Expense Claims',
      value: this.employeeSummary().pendingExpenses,
      icon: 'pi pi-receipt text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-950/20'
    },
    {
      title: 'Travel Trips',
      value: this.employeeSummary().pendingTravel,
      icon: 'pi pi-map text-warning-500',
      bg: 'bg-warning-50 dark:bg-warning-950/20'
    },
    {
      title: 'IT Assets',
      value: this.employeeSummary().pendingAssets,
      icon: 'pi pi-desktop text-success-500',
      bg: 'bg-success-50 dark:bg-success-950/20'
    }
  ]);

  adminMetrics = computed(() => [
    {
      title: 'Total Force',
      value: this.adminSummary().totalEmployees,
      icon: 'pi pi-users text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-950/20'
    },
    {
      title: 'Leave Inbox',
      value: this.adminSummary().pendingLeaves,
      icon: 'pi pi-sign-out text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-950/20'
    },
    {
      title: 'Expense Inbox',
      value: this.adminSummary().pendingExpenses,
      icon: 'pi pi-receipt text-warning-500',
      bg: 'bg-warning-50 dark:bg-warning-950/20'
    },
    {
      title: 'Travel Inbox',
      value: this.adminSummary().pendingTravel,
      icon: 'pi pi-map text-danger-500',
      bg: 'bg-danger-50 dark:bg-danger-950/20'
    },
    {
      title: 'Asset Inbox',
      value: this.adminSummary().pendingAssets,
      icon: 'pi pi-desktop text-success-500',
      bg: 'bg-success-50 dark:bg-success-950/20'
    },
    {
      title: 'No Manager',
      value: this.adminSummary().unassignedManagerCount || 0,
      icon: 'pi pi-user-minus text-red-500',
      bg: 'bg-red-50 dark:bg-red-950/20'
    },
    {
      title: 'No Dept',
      value: this.adminSummary().unassignedDeptCount || 0,
      icon: 'pi pi-exclamation-triangle text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/20'
    }
  ]);

  departmentList = computed(() => {
    const dist = this.adminSummary().departmentDist || {};
    return Object.keys(dist).map(key => ({
      name: key,
      count: dist[key]
    })).sort((a, b) => b.count - a.count);
  });

  ngOnInit(): void {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    this.loadDashboardData();
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  private loadDashboardData(): void {
    this.portalService.getEmployeeSummary().subscribe({
      next: (summary) => this.employeeSummary.set(summary),
      error: (err) => console.error('Failed to load employee summary', err)
    });

    if (this.authService.isAdmin()) {
      this.portalService.getAdminSummary().subscribe({
        next: (summary) => this.adminSummary.set(summary),
        error: (err) => console.error('Failed to load admin summary', err)
      });
    }

    this.portalService.getTodayAttendanceStatus().subscribe({
      next: (status) => {
        // If they clocked in today but haven't clocked out
        this.clockedIn.set(status && status.checkIn && !status.checkOut);
      },
      error: (err) => console.error('Failed to load today attendance state', err)
    });

    this.portalService.getMyTeam().subscribe({
      next: (team) => this.teamMembers.set(team),
      error: (err) => console.error('Failed to load my department team', err)
    });
  }

  handleClockIn(): void {
    this.loadingAttendance.set(true);
    this.portalService.clockIn().subscribe({
      next: () => {
        this.clockedIn.set(true);
        this.loadingAttendance.set(false);
      },
      error: (err) => {
        console.error('Failed to clock in', err);
        this.loadingAttendance.set(false);
      }
    });
  }

  handleClockOut(): void {
    this.loadingAttendance.set(true);
    this.portalService.clockOut().subscribe({
      next: () => {
        this.clockedIn.set(false);
        this.loadingAttendance.set(false);
      },
      error: (err) => {
        console.error('Failed to clock out', err);
        this.loadingAttendance.set(false);
      }
    });
  }
}
