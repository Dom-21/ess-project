import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface NotificationDto {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/notifications';

  readonly notifications = signal<NotificationDto[]>([]);
  readonly unreadCount = signal<number>(0);

  fetchNotifications(): void {
    this.http.get<NotificationDto[]>(this.apiUrl).subscribe({
      next: (res) => this.notifications.set(res),
      error: (err) => console.error('Failed to load notifications', err)
    });
    this.fetchUnreadCount();
  }

  fetchUnreadCount(): void {
    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: (err) => console.error('Failed to fetch unread count', err)
    });
  }

  markAsRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        // Optimistically update signals
        this.notifications.update(list => 
          list.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => 
          list.map(n => ({ ...n, read: true }))
        );
        this.unreadCount.set(0);
      })
    );
  }
}
