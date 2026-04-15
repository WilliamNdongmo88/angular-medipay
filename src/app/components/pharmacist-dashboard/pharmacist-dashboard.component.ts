import { Component, inject, OnInit , signal, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { WebSocketService } from '../../services/websocket.service';
import { CommunicationService } from '../../services/share.service';
import { NotificationService } from '../../services/notification.service';

const TYPE_DE_DEPOT = 'PAYMENT';

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
  private wsService = inject(WebSocketService);
  currentNotification = signal<any>(null);
  private subscription: any;

  private apiUrl: string | undefined;
  private isProd = environment.production;

  pharmacistName = '';
  pharmacistId = 0;
  currentBalance = signal<number>(0);
  paymentAmount: number | null = null;
  qrCodeValue = '';
  pollingInterval: any;
  qrCodeImage = signal<string | null>(null);
  isGeneratingDynamic = false;
  isGeneratingStatic = false;
  recentSales = signal<any[]>([]);

  constructor(
    private communicationService: CommunicationService,
    private notificationService: NotificationService
  )
  {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.apiUrl = environment.apiUrlProd;
    } else {
      this.apiUrl = environment.apiUrlDev;
    }

    //Démarrer la connexion WebSocket pour les mises à jour en temps réel
    this.wsService.connect();
    effect(() => {
      const data = this.wsService.transactions();
      console.log('🔥 Temps réel:', data);
      if (data.length > 0) {
        console.log('🔥 Temps réel Historique des transactions:', data);
        this.recentSales.set(data.filter(tx => tx.type === 'PAYMENT' && tx.receiverId === this.pharmacistId).slice(0, 6));
        console.log('Historique des ventes:', this.recentSales());
        this.currentBalance.set(
          data.reduce((acc, tx) =>
            acc + ((tx.type === 'PAYMENT' && tx.receiverId === this.pharmacistId) ? Number(tx.amount) : 0), 0
          )
        );
      }
    });
  }

  ngOnInit() {
    const pharmacist = this.authService.currentUser();
    this.pharmacistId = pharmacist?.id || 0;
    this.pharmacistName = pharmacist?.username || 'Pharmacien';
    this.loadData();
    // Optionnel : Polling toutes les 5 secondes pour vérifier les nouveaux paiements
    // this.pollingInterval = setInterval(() => {
    //   this.loadData();
    // }, 5000);

    // 4. ABONNEMENT : On écoute les nouvelles notifications
    this.communicationService.triggerAction$.subscribe((data) => {
      console.log('#Donnée reçue:', data);
      if(Number(data.receiverId) === this.pharmacistId && (data.type === TYPE_DE_DEPOT)) {
        this.notificationService.show({
          type: data.type,
          message: data.message,
          senderName: data.senderName
        });
      }
    });
  }

  ngOnDestroy() {
    // if (this.pollingInterval) {
    //   clearInterval(this.pollingInterval);
    // }
    this.wsService.disconnect();
    // Toujours se désabonner pour éviter les fuites de mémoire
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadData() {
    // 1. Charger l'historique (et par extension le solde)
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
    .subscribe({
      next: (data) => {
        console.log('Historique des transactions:', data);
        this.recentSales.set(data.filter(tx => tx.type === 'PAYMENT').slice(0, 6));
        console.log('Historique des ventes:', this.recentSales());
        this.currentBalance.set(
          data.reduce((acc, tx) =>
            acc + (tx.type === 'PAYMENT' ? Number(tx.amount) : 0), 0
          )
        );
        console.log('Solde actuel:', this.currentBalance());
        // Calculer le solde actuel (ou via un endpoint dédié si disponible)
        // Pour cet exemple, le solde est géré côté backend
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
      }

    });
  }

  generateQR() {
    this.isGeneratingDynamic = true;
    const request = { amount: this.paymentAmount };

    this.http.post<any>(`${this.apiUrl}/qrcode/generate`, request ).subscribe({
      next: (res) => {
        console.log('QR Code généré:', res.qrCodeValue);
        this.qrCodeValue = res.qrCodeValue;
        this.isGeneratingDynamic = false;
      },
      error: () => {
        alert('Erreur lors de la génération du QR Code');
        this.isGeneratingDynamic = false;
      }
    });
  }

  generateStaticQR() {
    this.isGeneratingStatic = true;

    this.http.get(`${this.apiUrl}/qrcode/generate/${this.pharmacistId}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.qrCodeImage.set(URL.createObjectURL(blob)); // 🔥 simple et efficace
        this.isGeneratingStatic = false;
      },
      error: (error) => {
        alert('Erreur lors de la génération du QR Code statique');
        console.error(error);
        this.isGeneratingStatic = false;
      }
    });
  }

  telechargerQrcode(){
    if (!this.qrCodeImage) {
      alert('Aucun QR Code à télécharger');
      return;
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
