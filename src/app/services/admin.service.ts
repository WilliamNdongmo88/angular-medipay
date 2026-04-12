import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { AuthResponse, User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
} )
export class AdminService {
  private http = inject(HttpClient );
  private apiUrl: string | undefined;
  private isProd = environment.production;

  currentUser = signal<User | null>(null );

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }
  }

  getRecentTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payment/history`).pipe(
      catchError(err => {
        console.error('Erreur lors du chargement des transactions récentes:', err);
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }
}
