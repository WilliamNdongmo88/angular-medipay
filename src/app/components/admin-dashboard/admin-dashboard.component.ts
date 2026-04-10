import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

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

  adminName = '';
  isProcessing = false;
  creditData = { userId: null, amount: null };
  recentTransactions: any[] = [];

  ngOnInit() {
    this.adminName = this.authService.currentUser()?.username || 'Admin';
    this.loadRecentTransactions();
  }

  loadRecentTransactions() {
    // Appel vers votre API (PaymentController /api/payment/history)
    this.http.get<any[]>('http://localhost:8008/api/payment/history' ).subscribe(data => {
      this.recentTransactions = data.slice(0, 5); // Garder les 5 dernières
    });
  }

  onCredit(event: Event) {
    event.preventDefault();
    this.isProcessing = true;

    this.http.post('http://localhost:8008/api/admin/credit', this.creditData ).subscribe({
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
