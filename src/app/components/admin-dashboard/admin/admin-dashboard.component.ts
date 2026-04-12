import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminService } from '../../../services/admin.service';
import { finalize } from 'rxjs';

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

  // Données pour la recherche
  allUsers: any[] = []; // Liste complète des patients récupérée au chargement
  filteredPatients: any[] = []; // Liste filtrée affichée dans les suggestions
  searchTerm: string = '';
  selectedPatient: any = null; // Le patient sélectionné

  // Données du formulaire
  creditData = {
    userId: null as number | null,
    amount: null as number | null
  };
  isProcessing = signal<boolean>(false);

  adminName = '';
  recentTransactions = signal<any[]>([]);
  totalDeposits = signal<number>(0);
  totalTransactions = signal<number>(0);
  totalUsers = signal<number>(0);
  pollingInterval: any;

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
    this.loadPatients();

    // Polling toutes les 15 secondes pour les mises à jour
    this.pollingInterval = setInterval(() => {
      this.loadPatients();
    }, 15000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }


  loadRecentTransactions() {
    this.http.get<any[]>(`${this.apiUrl}/payment/history`)
      .subscribe({
        next: data => {

          const users = new Set<string>();
          let totalDeposits = 0;

          data.forEach(tx => {
            if (tx.type === 'DEPOSIT') {
              totalDeposits += Number(tx.amount);
              users.add(tx.receiverName);
            }
          });

          this.recentTransactions.set(data.slice(0, 5));
          this.totalTransactions.set(data.length);
          this.totalDeposits.set(totalDeposits);
          this.totalUsers.set(users.size);

          console.log('Transactions:', this.recentTransactions());
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

    // Filtrer la liste à chaque frappe au clavier

    // Charger uniquement les utilisateurs ayant le rôle CLIENT
  loadPatients() {
    this.http.get<any[]>(`${this.apiUrl}/admin/users` ).subscribe(users => {
      this.allUsers = users.filter(u => u.role === 'ROLE_CLIENT');
      console.log('this.allUsers :', this.allUsers);
    });
  }

  onSearchChange() {
    if (this.searchTerm.length > 1) {
      this.filteredPatients = this.allUsers.filter(u =>
        u.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      ).slice(0, 5); // Limiter à 5 suggestions pour la clarté
    } else {
      this.filteredPatients = [];
    }
  }

  // Sélectionner un patient dans la liste
  selectPatient(patient: any) {
    this.selectedPatient = patient;
    this.creditData.userId = patient.id; // Récupération automatique de l'ID
    this.searchTerm = patient.username; // Afficher le nom dans le champ
    this.filteredPatients = []; // Cacher les suggestions
  }

  onCredit(event: Event) {
    event.preventDefault();
    if (!this.creditData.userId || !this.creditData.amount) return;

    this.isProcessing.set(true);
    // 2. On affiche la confirmation (le code s'arrête ici jusqu'au clic sur OK)
    if(confirm(`Voulez-vous créditer ${this.selectedPatient.username} de ${this.creditData.amount} XAF ?`)) {
        this.http.post(`${this.apiUrl}/admin/credit`, this.creditData )
        .pipe(finalize(() => {
          this.isProcessing.set(false);
          this.loadRecentTransactions(); // Recharger les transactions après le crédit
        }))
        .subscribe({
          next: () => {
            this.resetForm();
        },
        error: () => {
          alert('Erreur lors du crédit');
          this.isProcessing.set(false);
        }
      });
    }else{
      console.log("Dépot annulé par l'admin.");
      this.isProcessing.set(false);
    }
  }

  resetForm() {
    this.searchTerm = '';
    this.selectedPatient = null;
    this.creditData = { userId: null, amount: null };
  }

  // onCredit(event: Event) {
  //   event.preventDefault();
  //   this.isProcessing = true;

  //   this.http.post(`${this.apiUrl}/admin/credit`, this.creditData ).subscribe({
  //     next: () => {
  //       alert('Compte crédité avec succès !');
  //       this.isProcessing = false;
  //       this.creditData = { userId: null, amount: null };
  //       this.loadRecentTransactions();
  //     },
  //     error: () => {
  //       alert('Erreur lors du crédit.');
  //       this.isProcessing = false;
  //     }
  //   });
  // }

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
