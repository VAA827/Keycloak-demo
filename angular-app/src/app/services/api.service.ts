import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  getPublicMessage(): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/hello`);
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/profile`);
  }

  getAdminDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard`);
  }
}
