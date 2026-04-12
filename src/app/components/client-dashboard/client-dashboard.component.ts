import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
} )
export class ClientDashboardComponent implements OnInit {
  private http = inject(HttpClient );
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiUrl: string | undefined;
  private isProd = environment.production;

  clientName = '';
  clientId = 0;
  currentBalance = 0;
  isScanning = false;
  history = signal<any[]>([]);
  allowedFormats = [ BarcodeFormat.QR_CODE ];

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.clientName = user.username;
      this.clientId = user.id;
    }
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
    .subscribe({
      next: (data) => {
        this.history.set(data);
        // Calculer le solde : Somme(DEPOSIT) - Somme(PAYMENT)
        this.currentBalance = data.reduce((acc, tx) => {
          return tx.type === 'DEPOSIT' ? acc + tx.amount : acc - tx.amount;
        }, 0);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }

    });
  }

  onScanSuccess(qrCodeValue: string) {
    this.isScanning = false;
    if (confirm(`Confirmer le paiement via QR Code ?`)) {
      this.http.post(`${this.apiUrl}/payment/scan`, { qrCodeValue } ).subscribe({
        next: () => {
          alert('Paiement réussi !');
          this.loadData();
        },
        error: (err) => {
          alert(err.error?.message || 'Erreur lors du paiement (Solde insuffisant ou QR invalide)');
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
