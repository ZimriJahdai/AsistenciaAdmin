import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type LoginResponse = {
  token: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/login`;
  private readonly tokenKey = 'attendance_admin_token';
  readonly loggedIn = signal(Boolean(this.getToken()));

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { password }).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        this.loggedIn.set(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn.set(false);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
