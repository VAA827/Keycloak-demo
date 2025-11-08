import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminData, ProfileData, PublicMessage } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPublicMessage(): Observable<PublicMessage> {
    return this.http.get<PublicMessage>(`${this.apiUrl}/public/hello`);
  }

  getUserProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(`${this.apiUrl}/user/profile`);
  }

  getAdminDashboard(): Observable<AdminData> {
    return this.http.get<AdminData>(`${this.apiUrl}/admin/dashboard`);
  }
}
