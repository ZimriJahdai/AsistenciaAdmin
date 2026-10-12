import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AttendanceRecord } from '../models/attendance.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly apiUrl = `${environment.apiBaseUrl}/forms`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getRecords(): Observable<AttendanceRecord[]> {
    const token = this.authService.getToken();

    return this.http.get<AttendanceRecord[]>(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  deleteRecords(ids: string[]): Observable<{ deletedCount: number }> {
    const token = this.authService.getToken();

    return this.http.delete<{ deletedCount: number }>(this.apiUrl, {
      body: {
        ids,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
