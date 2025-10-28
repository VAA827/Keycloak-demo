import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  adminData: any = null;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        this.adminData = data;
      },
      error: (err) => {
        this.error = 'Nincs jogosultságod az admin felülethez!';
        console.error('Hiba:', err);
      }
    });
  }
}
