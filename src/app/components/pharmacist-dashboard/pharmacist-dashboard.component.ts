import { Component, inject, OnInit , signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrls: ['./pharmacist-dashboard.component.scss']
} )
export class PharmacistDashboardComponent implements OnInit {
  private http = inject(HttpClient );
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiUrl: string | undefined;
  private isProd = environment.production;

  pharmacistName = '';
  currentBalance = signal<number>(0);
  paymentAmount: number | null = null;
  qrCodeValue = '';
  isGenerating = false;
  recentSales = signal<any[]>([]);

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }
  }

  ngOnInit() {
    this.pharmacistName = this.authService.currentUser()?.username || 'Pharmacien';
    this.loadData();
    // Optionnel : Polling toutes les 5 secondes pour vérifier les nouveaux paiements
    setInterval(() => this.loadData(), 5000);
  }

  loadData() {
    // 1. Charger l'historique (et par extension le solde)
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
    .subscribe({
      next: (data) => {
        this.recentSales.set(data.filter(tx => tx.type === 'PAYMENT').slice(0, 8));
        console.log('Historique des ventes:', this.recentSales());
        this.currentBalance.set(
          data.reduce((acc, tx) =>
            acc + (tx.type === 'PAYMENT' ? Number(tx.amount) : 0), 0
          )
        );
        console.log('Solde actuel:', this.currentBalance());
        // Calculer le solde actuel (ou via un endpoint dédié si disponible)
        // Pour cet exemple, on suppose que le solde est géré côté backend
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
      }

    });
  }

  generateQR() {
    this.isGenerating = true;
    const request = { amount: this.paymentAmount };

    this.http.post<any>(`${this.apiUrl}/qrcode/generate`, request ).subscribe({
      next: (res) => {
        console.log('QR Code généré:', res.qrCodeValue);
        this.qrCodeValue = res.qrCodeValue;
        this.isGenerating = false;
      },
      error: () => {
        alert('Erreur lors de la génération du QR Code');
        this.isGenerating = false;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
