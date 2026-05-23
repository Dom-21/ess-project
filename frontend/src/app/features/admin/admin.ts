import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalService } from '../../core/services/portal.service';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  private readonly portalService = inject(PortalService);

  activeTab = signal<'employees' | 'users' | 'departments'>('employees');

  employees = signal<any[]>([]);
  users = signal<any[]>([]);
  departments = signal<any[]>([]);
  allEmployees = signal<any[]>([]);
  
  // Assignment Drawer State
  selectedEmployee = signal<any | null>(null);
  selectedManagerId = signal<number | null>(null);
  selectedDepartmentId = signal<number | null>(null);

  // Department Form State
  newDeptName = signal<string>('');
  newDeptCode = signal<string>('');

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalEmployees = signal<number>(0);

  // Constants
  readonly availableRoles = [
    'ROLE_EMPLOYEE',
    'ROLE_MANAGER',
    'ROLE_HR_ADMIN',
    'ROLE_FINANCE_MANAGER',
    'ROLE_IT_ADMIN',
    'ROLE_SUPER_ADMIN'
  ];

  ngOnInit(): void {
    this.loadEmployees();
    this.loadUsers();
    this.loadAllEmployees();
    this.loadDepartments();
  }

  loadEmployees(): void {
    this.portalService.getAdminEmployees(this.currentPage(), 10).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.employees.set(res.content);
          this.totalPages.set(res.totalPages || 0);
          this.totalEmployees.set(res.totalElements || 0);
        } else {
          this.employees.set([]);
        }
      },
      error: (err) => console.error('Failed to load employees for administration', err)
    });
  }

  loadUsers(): void {
    this.portalService.getAdminUsers().subscribe({
      next: (res) => this.users.set(res || []),
      error: (err) => console.error('Failed to load authentication users', err)
    });
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadEmployees();
  }

  addRole(userId: number, roleName: string): void {
    if (!roleName) return;

    this.portalService.updateUserRoles(userId, roleName).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error(`Failed to assign role ${roleName} to user #${userId}`, err);
        alert(err?.error?.message || 'Error occurred while updating roles.');
      }
    });
  }

  removeRole(userId: number, roleId: number): void {
    if (!confirm('Are you sure you want to remove this security role clearance?')) return;

    this.portalService.removeUserRole(userId, roleId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error(`Failed to remove role #${roleId} from user #${userId}`, err);
        alert(err?.error?.message || 'Error occurred while deleting role assignment.');
      }
    });
  }

  loadAllEmployees(): void {
    this.portalService.getAllEmployeesList().subscribe({
      next: (res) => this.allEmployees.set(res || []),
      error: (err) => console.error('Failed to load all employees list', err)
    });
  }

  loadDepartments(): void {
    this.portalService.getDepartments().subscribe({
      next: (res) => this.departments.set(res || []),
      error: (err) => console.error('Failed to load departments', err)
    });
  }

  openAssignDrawer(emp: any): void {
    this.selectedEmployee.set(emp);
    this.selectedManagerId.set(emp.reportingManagerId || null);
    this.selectedDepartmentId.set(emp.departmentId || null);
  }

  closeAssignDrawer(): void {
    this.selectedEmployee.set(null);
  }

  submitAssignment(): void {
    const emp = this.selectedEmployee();
    if (!emp) return;

    const data = {
      reportingManagerId: this.selectedManagerId() ? Number(this.selectedManagerId()) : null,
      departmentId: this.selectedDepartmentId() ? Number(this.selectedDepartmentId()) : null
    };

    this.portalService.assignManagerAndDepartment(emp.id, data).subscribe({
      next: () => {
        alert('Organizational structure updated successfully.');
        this.closeAssignDrawer();
        this.loadEmployees();
        this.loadAllEmployees(); // Refresh lists
      },
      error: (err) => {
        console.error('Failed to save manager/department assignment', err);
        alert(err?.error?.message || 'Error occurred while saving assignments.');
      }
    });
  }

  addDepartment(): void {
    const name = this.newDeptName().trim();
    const code = this.newDeptCode().trim();

    if (!name || !code) {
      alert('Please fill in all department fields.');
      return;
    }

    this.portalService.createDepartment({ name, code }).subscribe({
      next: () => {
        alert('Department registered successfully.');
        this.newDeptName.set('');
        this.newDeptCode.set('');
        this.loadDepartments();
      },
      error: (err) => {
        console.error('Failed to create department', err);
        alert(err?.error?.message || 'Error occurred while registering department.');
      }
    });
  }
}
