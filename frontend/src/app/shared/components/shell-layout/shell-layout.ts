import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PortalService } from '../../../core/services/portal.service';
import { filter, Subscription } from 'rxjs';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: () => string | number | undefined;
  visible: () => boolean;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell-layout.html'
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly portalService = inject(PortalService);

  sidebarOpen = signal<boolean>(false);
  showNotifications = signal<boolean>(false);
  currentTitle = signal<string>('Dashboard');

  private routeSub?: Subscription;

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi pi-chart-pie',
      visible: () => true
    },
    {
      label: 'Profile',
      route: '/profile',
      icon: 'pi pi-user',
      visible: () => true
    },
    {
      label: 'Attendance',
      route: '/attendance',
      icon: 'pi pi-calendar-times',
      visible: () => true
    },
    {
      label: 'Leave Center',
      route: '/leave',
      icon: 'pi pi-sign-out',
      visible: () => true
    },
    {
      label: 'Travel Claims',
      route: '/travel',
      icon: 'pi pi-map',
      visible: () => true
    },
    {
      label: 'Expense Claims',
      route: '/expense',
      icon: 'pi pi-receipt',
      visible: () => true
    },
    {
      label: 'Asset Allocation',
      route: '/asset',
      icon: 'pi pi-desktop',
      visible: () => true
    },
    {
      label: 'Workflow Tasks',
      route: '/workflow',
      icon: 'pi pi-inbox',
      visible: () => this.authService.isManager() || this.authService.userPermissions().some(p => p.startsWith('APPROVE_'))
    },
    {
      label: 'Administration',
      route: '/admin',
      icon: 'pi pi-sliders-h',
      visible: () => this.authService.isAdmin()
    }
  ];

  ngOnInit(): void {
    // Initial fetch
    this.notificationService.fetchNotifications();

    // Poll notifications every 45s
    const interval = setInterval(() => {
      this.notificationService.fetchNotifications();
    }, 45000);

    // Track route change to update shell header title
    this.updateTitle(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateTitle(event.urlAfterRedirects || event.url);
        this.showNotifications.set(false);
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
  }

  readNotification(id: number): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.isDarkMode() ? 'dark' : 'light';
    if (this.authService.isAuthenticated()) {
      this.portalService.updateTheme(newTheme).subscribe({
        error: (err) => console.error('Failed to sync theme to backend database', err)
      });
      this.authService.updateSessionTheme(newTheme);
    }
  }

  private updateTitle(url: string): void {
    const item = this.navItems.find(n => url.startsWith(n.route));
    if (item) {
      this.currentTitle.set(item.label);
    } else if (url.includes('/login')) {
      this.currentTitle.set('Login');
    } else {
      this.currentTitle.set('ESS Portal');
    }
  }
}
