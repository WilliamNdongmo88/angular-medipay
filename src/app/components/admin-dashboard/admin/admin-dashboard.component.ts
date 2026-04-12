import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  recentTransactions = signal<any[]>([]);
  totalDeposits = signal<number>(0);
  totalTransactions = signal<number>(0);
  totalUsers = signal<number>(0);

  constructor(private adminService: AdminService) {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }
  }

  ngOnInit() {
    console.log("INIT OK");
    this.adminName = this.authService.currentUser()?.username || 'Admin';
    this.loadRecentTransactions();
  }

  loadRecentTransactions() {
    // Appel vers votre API (PaymentController /api/payment/history)
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
    .subscribe({
      next: data => {
        this.recentTransactions.set(data.slice(0, 5)); // Garder les 5 dernières
        console.log('this.recentTransactions :', this.recentTransactions());
        this.totalTransactions.set(data.length);
        this.totalDeposits.set(data.reduce((sum, tx) => sum + tx.amount, 0));
        this.totalUsers.set(new Set(data.map(tx => tx.userId)).size); // Nombre d'utilisateurs uniques
      },
      error: (err) => {
        console.error("ERREUR API:", err);
      }
    });
  }

  // loadRecentTransactions() {
  //   this.adminService.getRecentTransactions().subscribe({
  //     next: (recentTransactions) => {
  //       this.recentTransactions = recentTransactions;
  //       console.log('this.recentTransactions :', this.recentTransactions);
  //     },
  //     error: (error) => {
  //       console.error('Erreur lors du chargement des Transactions recentes:', error);
  //     }
  //   });
  // }

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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToTransaction() {
    console.log("Navigating to transactions...");
    this.router.navigate(['/admin/transactions']);
  }

  navigateToUsers() {
    console.log("Navigating to users...");
    this.router.navigate(['/admin/users']);
  }
}
