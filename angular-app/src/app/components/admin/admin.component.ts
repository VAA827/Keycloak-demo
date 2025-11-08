import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LoggerService } from '../../services/logger.service';
import { AdminData } from '../../models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  adminData: AdminData | null = null;
  error = '';

  constructor(
    private apiService: ApiService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadAdminDashboard();
  }

  private loadAdminDashboard(): void {
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        this.adminData = data;
        this.error = '';
      },
      error: (err) => {
        this.error = 'Nincs jogosultságod az admin felülethez!';
        this.logger.error('Hiba az admin dashboard betöltésekor:', err);
        this.adminData = null;
      }
    });
  }
}
