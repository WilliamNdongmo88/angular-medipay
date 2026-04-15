import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, FormsModule, RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
} )
export class ClientDashboardComponent implements OnInit {
  private http = inject(HttpClient );
  private authService = inject(AuthService);
  private router = inject(Router);
  private wsService = inject(WebSocketService);
  currentNotification = signal<any>(null);
  private subscription: any;

  private apiUrl: string | undefined;
  private isProd = environment.production;

  // État de la Modal de Paiement
  showPaymentModal = false;
  pharmacistId: number | null = null;
  pharmacistName: string = '';
  amount: number | null = null;
  isProcessing = signal<boolean>(false);

  clientName = '';
  clientId = 0;
  currentBalance = signal<number>(0);
  isScanning = false;
  history = signal<any[]>([]);
  allowedFormats = [ BarcodeFormat.QR_CODE ];
  showBalance = signal(true);

  constructor(private notificationService: NotificationService) {
    // Définir l'URL de l'API selon l'environnement
    this.apiUrl = this.isProd ? environment.apiUrlProd : environment.apiUrlDev;

    const user = this.authService.currentUser();
    if (user) {
      console.log('Utilisateur connecté:', user);
      this.clientName = user.username;
      this.clientId = user.id;
    }

    //Démarrer la connexion WebSocket pour les mises à jour en temps réel
    //this.wsService.connect(); // La connexion est déjà établie globalement dans AppComponent, pas besoin de la refaire ici
    effect(() => {
      const data = this.wsService.transactions();
      console.log('🔥 Temps réel:', data);
      if (data.length > 0) {
        // Calculer le solde : Somme(DEPOSIT) + Somme(COURANT)
        this.history.set(data.filter(tx => tx.type === 'DEPOSIT' && tx.receiverId === this.clientId));
        console.log('Historique des ventes:', this.history());
        this.currentBalance.set(
          this.history().filter(t => t.type === 'DEPOSIT')
              .reduce((max, t) => t.receiverBalance > max ? t.receiverBalance : max, 0)
        );
        console.log("#currentBalance: ", this.currentBalance());
      }
    });
  }

  ngOnInit() {
    // const user = this.authService.currentUser();
    // if (user) {
    //   this.clientName = user.username;
    //   this.clientId = user.id;
    // }
    this.loadData();
  }

  ngOnDestroy(){
    //this.wsService.disconnect();
    // Toujours se désabonner pour éviter les fuites de mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadData() {
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
    .subscribe({
      next: (data) => {
        this.history.set(data);
        console.log("#data: ", data);
        // Calculer le solde : Somme(DEPOSIT) - Somme(PAYMENT)
        this.currentBalance.set(
          data.reduce((acc, tx) => {
            return tx.type === 'DEPOSIT' ? acc + tx.amount : acc - tx.amount;
          }, 0)
        );
        console.log("#current: ", this.currentBalance());
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }

    });
  }

  onScanSuccess(qrCodeValue: string) {
    this.isScanning = false;
    console.log('QR Code Scanné:', qrCodeValue);
    if (qrCodeValue.startsWith('medipay://pay')) {
      console.log('Redirection vers la page de paiement...');
      try {
        const url = new URL(qrCodeValue.replace('medipay://', 'http://'));

        const pharmacistId = url.searchParams.get('pharmacistId');
        const name = url.searchParams.get('name');

        console.log('Pharmacien:', pharmacistId, name);

        // 👉 redirection vers écran paiement
        this.openPaymentModal(+pharmacistId!, name!);

      } catch (error) {
        console.error('QR invalide');
      }
    }else if (confirm(`Confirmer le paiement via QR Code ?`)) {
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

    openPaymentModal(pharmacistId: number, pharmacistName: string) {
    this.pharmacistId = pharmacistId;
    this.pharmacistName = pharmacistName;
    this.amount = null; // Réinitialiser le montant
    this.showPaymentModal = true;
  }

  closeModal() {
    if (!this.isProcessing()) {
      this.showPaymentModal = false;
    }
  }

  confirmPayment() {
    if (!this.pharmacistId || !this.amount || this.amount <= 0) return;

    this.isProcessing.set(true);

    const payload = {
      qrCodeValue: null, // Pas de QR Code dans ce cas, paiement direct
      pharmacistId: this.pharmacistId,
      amount: this.amount
    };

    // Appel à l'API de paiement ouvert
    this.http.post(`${this.apiUrl}/payment/pay-open`, payload ).subscribe({
      next: () => {
        this.isProcessing.set(false);
        alert(`Paiement de ${this.amount} FCFA effectué avec succès à ${this.pharmacistName} !`);
        this.showPaymentModal = false;
        this.loadData(); // Rafraîchir le solde et l'historique
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Erreur lors du paiement:', err.error.message);
        console.error('Erreur lors du paiement:', err.error.message.split(':')[1]?.trim());
        alert(err.error.message.split(':')[1]?.trim());
      }
    });
  }

  onLogout() {
    this.notificationService.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleBalance() {
    this.showBalance.update(v => !v);
  }
}
