import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './shared/components/shell-layout/shell-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.LoginComponent) },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent) },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance').then(m => m.AttendanceComponent) },
      { path: 'leave', loadComponent: () => import('./features/leave/leave').then(m => m.LeaveComponent) },
      { path: 'travel', loadComponent: () => import('./features/travel/travel').then(m => m.TravelComponent) },
      { path: 'expense', loadComponent: () => import('./features/expense/expense').then(m => m.ExpenseComponent) },
      { path: 'asset', loadComponent: () => import('./features/asset/asset').then(m => m.AssetComponent) },
      { path: 'workflow', loadComponent: () => import('./features/workflow/workflow').then(m => m.WorkflowComponent) },
      { path: 'admin', loadComponent: () => import('./features/admin/admin').then(m => m.AdminComponent), canActivate: [adminGuard] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
