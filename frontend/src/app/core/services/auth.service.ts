import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ThemeService } from './theme.service';

export interface UserSession {
  token: string;
  refreshToken: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  theme?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly apiUrl = '/api/auth';

  // Signals-based Session Store
  readonly session = signal<UserSession | null>(null);

  // Computed signals for fast state checks
  readonly isAuthenticated = computed(() => !!this.session());
  readonly employeeId = computed(() => this.session()?.employeeId || '');
  readonly userRoles = computed(() => this.session()?.roles || []);
  readonly userPermissions = computed(() => this.session()?.permissions || []);
  
  readonly isAdmin = computed(() => 
    this.userRoles().some(role => role.includes('ADMIN') || role === 'HR')
  );
  readonly isManager = computed(() => 
    this.userRoles().some(role => role.includes('MANAGER') || role.includes('ADMIN') || role.includes('LEAD'))
  );
  readonly userFullName = computed(() => {
    const s = this.session();
    return s ? `${s.firstName} ${s.lastName}` : '';
  });

  constructor() {
    this.loadSessionFromStorage();
  }

  login(email: string, password: string): Observable<UserSession> {
    return this.http.post<UserSession>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        this.saveSession(res);
      })
    );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem('ess_session');
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<UserSession> {
    const currentSession = this.session();
    if (!currentSession || !currentSession.refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<UserSession>(`${this.apiUrl}/refresh-token`, { 
      refreshToken: currentSession.refreshToken 
    }).pipe(
      tap((res) => {
        this.saveSession(res);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  updateSessionTheme(theme: string): void {
    const s = this.session();
    if (s) {
      s.theme = theme;
      this.session.set({ ...s });
      localStorage.setItem('ess_session', JSON.stringify(s));
    }
  }

  private saveSession(session: UserSession): void {
    this.session.set(session);
    localStorage.setItem('ess_session', JSON.stringify(session));
    if (session.theme) {
      this.themeService.setTheme(session.theme);
    }
  }

  private loadSessionFromStorage(): void {
    try {
      const data = localStorage.getItem('ess_session');
      if (data) {
        const decoded = JSON.parse(data) as UserSession;
        this.session.set(decoded);
        if (decoded.theme) {
          this.themeService.setTheme(decoded.theme);
        }
      }
    } catch (e) {
      console.error('Failed to parse active user session', e);
      this.logout();
    }
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }
}
