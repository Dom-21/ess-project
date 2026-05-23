import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortalService {
  private readonly http = inject(HttpClient);

  // ==========================================
  // 1. DASHBOARD APIs
  // ==========================================
  getEmployeeSummary(): Observable<any> {
    return this.http.get<any>('/api/dashboard/employee/summary');
  }

  getAdminSummary(): Observable<any> {
    return this.http.get<any>('/api/dashboard/admin/summary');
  }

  // ==========================================
  // 2. EMPLOYEE & PROFILE APIs
  // ==========================================
  getProfile(): Observable<any> {
    return this.http.get<any>('/api/employees/me');
  }

  getMyTeam(): Observable<any[]> {
    return this.http.get<any[]>('/api/employees/team');
  }

  // ==========================================
  // 3. ATTENDANCE APIs
  // ==========================================
  getTodayAttendanceStatus(): Observable<any> {
    return this.http.get<any>('/api/attendance/today');
  }

  clockIn(): Observable<any> {
    return this.http.post<any>('/api/attendance/clock-in', {});
  }

  clockOut(): Observable<any> {
    return this.http.post<any>('/api/attendance/clock-out', {});
  }

  getAttendanceLogs(page: number = 0, size: number = 10, from: string, to: string): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size).set('from', from).set('to', to);
    return this.http.get<any>('/api/attendance/me', { params });
  }

  submitRegularization(data: any): Observable<any> {
    return this.http.post<any>('/api/attendance/regularize', data);
  }

  // ==========================================
  // 4. LEAVE APIs
  // ==========================================
  getLeaveBalances(): Observable<any[]> {
    return this.http.get<any[]>('/api/leaves/balances');
  }

  getLeaveRequests(): Observable<any[]> {
    return this.http.get<any[]>('/api/leaves/me');
  }

  submitLeaveRequest(data: any): Observable<any> {
    return this.http.post<any>('/api/leaves/request', data);
  }

  cancelLeaveRequest(id: number): Observable<any> {
    return this.http.post<any>(`/api/leaves/cancel/${id}`, {});
  }

  // ==========================================
  // 5. TRAVEL APIs
  // ==========================================
  getTravelRequests(): Observable<any[]> {
    return this.http.get<any[]>('/api/travel/me');
  }

  submitTravelRequest(data: any): Observable<any> {
    return this.http.post<any>('/api/travel/request', data);
  }

  cancelTravelRequest(id: number): Observable<any> {
    return this.http.post<any>(`/api/travel/cancel/${id}`, {});
  }

  // ==========================================
  // 6. EXPENSE APIs
  // ==========================================
  getExpenseRequests(): Observable<any[]> {
    return this.http.get<any[]>('/api/expenses/me');
  }

  submitExpenseRequest(data: any): Observable<any> {
    return this.http.post<any>('/api/expenses/request', data);
  }

  cancelExpenseRequest(id: number): Observable<any> {
    return this.http.post<any>(`/api/expenses/cancel/${id}`, {});
  }

  // ==========================================
  // 7. ASSET APIs
  // ==========================================
  getAssetRequests(): Observable<any> {
    return this.http.get<any>('/api/assets/requests/me');
  }

  getAvailableAssets(): Observable<any[]> {
    return this.http.get<any[]>('/api/assets/available');
  }

  submitAssetRequest(data: any): Observable<any> {
    return this.http.post<any>('/api/assets/request', data);
  }

  cancelAssetRequest(id: number): Observable<any> {
    return this.http.post<any>(`/api/assets/requests/${id}/return`, {});
  }

  // ==========================================
  // 8. WORKFLOW (MAKER-CHECKER) APIs
  // ==========================================
  getPendingWorkflowTasks(): Observable<any[]> {
    return this.http.get<any[]>('/api/workflow/tasks/pending');
  }

  processWorkflowTask(taskId: number, action: 'APPROVE' | 'REJECT', remarks: string): Observable<any> {
    return this.http.post<any>('/api/workflow/tasks/action', {
      workflowTaskId: taskId,
      action,
      comment: remarks
    });
  }

  // ==========================================
  // 9. ADMIN APIs
  // ==========================================
  getAdminEmployees(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>('/api/employees', { params });
  }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/users');
  }

  updateUserRoles(userId: number, roleName: string): Observable<any> {
    return this.http.post<any>(`/api/admin/users/${userId}/roles?roleName=${roleName}`, {});
  }

  removeUserRole(userId: number, roleId: number): Observable<any> {
    return this.http.delete<any>(`/api/admin/users/${userId}/roles/${roleId}`);
  }

  // ==========================================
  // 10. DETAIL GETTERS (FOR WORKFLOW TASKS)
  // ==========================================
  getLeaveById(id: number): Observable<any> {
    return this.http.get<any>(`/api/leaves/${id}`);
  }

  getTravelById(id: number): Observable<any> {
    return this.http.get<any>(`/api/travel/${id}`);
  }

  getExpenseById(id: number): Observable<any> {
    return this.http.get<any>(`/api/expenses/${id}`);
  }

  getAssetById(id: number): Observable<any> {
    return this.http.get<any>(`/api/assets/requests/${id}`);
  }

  // ==========================================
  // 11. HR ADMIN & DEPARTMENT APIs
  // ==========================================
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>('/api/departments');
  }

  createDepartment(data: any): Observable<any> {
    return this.http.post<any>('/api/departments', data);
  }

  assignManagerAndDepartment(employeeId: number, data: { reportingManagerId: number | null, departmentId: number | null }): Observable<any> {
    return this.http.put<any>(`/api/employees/${employeeId}/assign`, data);
  }

  getAllEmployeesList(): Observable<any[]> {
    return this.http.get<any[]>('/api/employees/all');
  }

  // ==========================================
  // 12. LEAVE REGISTRY APIs (HR ADMIN)
  // ==========================================
  getLeaveTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/leaves/types');
  }

  createLeaveType(data: any): Observable<any> {
    return this.http.post<any>('/api/leaves/types', data);
  }

  updateLeaveType(id: number, data: any): Observable<any> {
    return this.http.put<any>(`/api/leaves/types/${id}`, data);
  }

  allocateLeaveBalance(data: any): Observable<any> {
    return this.http.post<any>('/api/leaves/balances/allocate', data);
  }

  // ==========================================
  // 13. THEME PERSISTENCE API
  // ==========================================
  updateTheme(theme: string): Observable<any> {
    return this.http.put<any>(`/api/auth/theme?theme=${theme}`, {});
  }
}
