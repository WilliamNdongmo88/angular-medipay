import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { AuthResponse, User } from '../models/user.model';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
} )
export class AuthService {
  private http = inject(HttpClient );
  private apiUrl: string | undefined;
  private isProd = environment.production;

  currentUser = signal<User | null>(null );

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd + '/auth';
    } else {
      this.apiUrl = environment.apiUrlDev +'/auth';
    }
    this.loadUserFromToken();
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, credentials ).pipe(
      tap(response => {
        this.saveTokens(response.accessToken, response.refreshToken);
        this.loadUserFromToken();
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('medipay_refresh_token');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken } ).pipe(
      tap(response => this.saveTokens(response.accessToken, response.refreshToken)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  private saveTokens(access: string, refresh: string) {
    localStorage.setItem('medipay_access_token', access);
    localStorage.setItem('medipay_refresh_token', refresh);
  }

  logout() {
    localStorage.removeItem('medipay_access_token');
    localStorage.removeItem('medipay_refresh_token');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('medipay_access_token');
  }

  private loadUserFromToken() {
    const token = localStorage.getItem('medipay_access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser.set({
          id: decoded.id,
          username: decoded.sub,
          email: decoded.email,
          role: decoded.role[0].authority || decoded.role // Selon la structure du token
        });
      } catch (e) {
        this.logout();
      }
    }
  }

  getAccessToken() {
    return localStorage.getItem('medipay_access_token');
  }
}
