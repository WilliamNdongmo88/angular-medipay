import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
} )
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient );
  private apiUrl: string | undefined;
  private isProd = environment.production;

  adminName = '';
  isProcessing = false;
  creditData = { userId: null, amount: null };
  recentTransactions: any[] = [];

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }
  }

  ngOnInit() {
    this.adminName = this.authService.currentUser()?.username || 'Admin';
    this.loadRecentTransactions();
  }

  loadRecentTransactions() {
    // Appel vers votre API (PaymentController /api/payment/history)
    this.http.get<any[]>(`${this.apiUrl}/payment/history` ).subscribe(data => {
      this.recentTransactions = data.slice(0, 5); // Garder les 5 dernières
    });
  }

  onCredit(event: Event) {
    event.preventDefault();
    this.isProcessing = true;

    this.http.post(`${this.apiUrl}/admin/credit`, this.creditData ).subscribe({
      next: () => {
        alert('Compte crédité avec succès !');
        this.isProcessing = false;
        this.creditData = { userId: null, amount: null };
        this.loadRecentTransactions();
      },
      error: () => {
        alert('Erreur lors du crédit.');
        this.isProcessing = false;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
