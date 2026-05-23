import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalService } from '../../core/services/portal.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  private readonly portalService = inject(PortalService);
  profile = signal<any | null>(null);

  ngOnInit(): void {
    this.portalService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Failed to load profile', err)
    });
  }
}
