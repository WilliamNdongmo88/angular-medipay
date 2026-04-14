import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { WebSocketService } from '../../../services/websocket.service';

interface Transaction {
  id: number;
  receiverName: string;
  senderWalletId: number;
  receiverWalletId: number;
  senderBalance: number;
  receiverBalance: number;
  amount: number;
  type: 'DEPOSIT' | 'PAYMENT' | 'RESET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  description?: string;
  referenceQr?: string;
}

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);

  transactions = signal<Transaction[]>([]);
  filteredTransactions = signal<Transaction[]>([]); // Signal pour les transactions filtrées
  adminName = '';
  isLoading = false;
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  startDate = '';
  endDate = '';
  pollingInterval: any;
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalTransactions = 0;

  // Statistiques
  totalAmount = 0;
  depositCount = 0;
  paymentCount = 0;

  private apiUrl: string | undefined;
  private isProd = environment.production;

  constructor() {
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
        this.transactions.set(data);
        this.currentPage = 1; // 🔥 CRITIQUE
        this.calculateStatistics(); // 🔥 IMPORTANT
        this.applyFilters();
      }
    });
  }

  ngOnInit() {
    this.adminName = this.authService.currentUser()?.username || 'Admin';
    this.loadTransactions();

    // Polling toutes les 20 secondes
    // this.pollingInterval = setInterval(() => {
    //   this.loadTransactions();
    // }, 20000);
  }

  ngOnDestroy() {
    // if (this.pollingInterval) {
    //   clearInterval(this.pollingInterval);
    // }
    this.wsService.disconnect();
  }

  loadTransactions() {
    this.isLoading = true;
    this.http.get<Transaction[]>(`${this.apiUrl}/admin/transactions`).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.totalTransactions = data.length;
        this.calculateStatistics();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des transactions:', err);
        this.isLoading = false;
      }
    });
  }

  calculateStatistics() {
    this.totalAmount = this.transactions()
      .filter(tx => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);

    this.depositCount = this.transactions().filter(tx => tx.type === 'DEPOSIT').length;
    this.paymentCount = this.transactions().filter(tx => tx.type === 'PAYMENT').length;
  }

  // applyFilters() {
  //   this.filteredTransactions.set(
  //       this.transactions().filter(tx => {
  //       const matchesSearch = tx.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //                           tx.id.toString().includes(this.searchTerm);
  //       const matchesType = this.selectedType === '' || tx.type === this.selectedType;
  //       const matchesStatus = this.selectedStatus === '' || tx.status === this.selectedStatus;

  //       let matchesDateRange = true;
  //       if (this.startDate || this.endDate) {
  //         const txDate = new Date(tx.timestamp);
  //         if (this.startDate) {
  //           matchesDateRange = matchesDateRange && txDate >= new Date(this.startDate);
  //         }
  //         if (this.endDate) {
  //           matchesDateRange = matchesDateRange && txDate <= new Date(this.endDate);
  //         }
  //       }

  //       return matchesSearch && matchesType && matchesStatus && matchesDateRange;
  //     })
  //  );

  //  console.log('Transactions après filtrage:', this.filteredTransactions());
  //   // Pagination
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   this.filteredTransactions.set(this.filteredTransactions().slice(startIndex, startIndex + this.itemsPerPage));
  // }
  applyFilters() {
    const allTx = this.transactions();
    let filtered = allTx.filter(tx => {
      const matchesSearch =
        tx.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tx.id.toString().includes(this.searchTerm);

      const matchesType =
        this.selectedType === '' || tx.type === this.selectedType;

      const matchesStatus =
        this.selectedStatus === '' || tx.status === this.selectedStatus;

      let matchesDateRange = true;

      if (this.startDate || this.endDate) {
        const txDate = new Date(tx.timestamp);

        if (this.startDate) {
          matchesDateRange = matchesDateRange && txDate >= new Date(this.startDate);
        }

        if (this.endDate) {
          matchesDateRange = matchesDateRange && txDate <= new Date(this.endDate);
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    });

    this.totalTransactions = filtered.length;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;

    this.filteredTransactions.set(filtered.slice(startIndex, startIndex + this.itemsPerPage));
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterByType(type: string) {
    this.selectedType = type;
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterByStatus(status: string) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-success';
      case 'PAYMENT':
        return 'bg-primary';
      case 'RESET':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      case 'FAILED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return 'Dépôt';
      case 'PAYMENT':
        return 'Paiement';
      case 'RESET':
        return 'Réinitialisation';
      default:
        return type;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Complétée';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échouée';
      default:
        return status;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  getTotalPages(): number {
    return Math.ceil(this.transactions().length / this.itemsPerPage);
  }

  exportToCSV() {
    const csv = this.convertToCSV(this.transactions());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: Transaction[]): string {
    const headers = ['Type', 'Montant', 'Statut', 'Name', 'Date', 'Description'];
    const rows = data.map(tx => [
      tx.type,
      tx.amount,
      this.getTypeLabel(tx.type),
      this.getStatusLabel(tx.status),
      new Date(tx.timestamp).toLocaleString(),
      tx.description || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csv;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
