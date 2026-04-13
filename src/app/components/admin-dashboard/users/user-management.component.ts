import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { WebSocketService } from '../../../services/websocket.service';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'PHARMACIST';
  creationDate: string;
  lastLoginDate?: string;
  walletBalance?: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);

  users = signal<User[]>([]);
  //filteredUsers: User[] = [];
  filteredUsers = signal<User[]>([]);
  adminName = '';
  isLoading = false;
  searchTerm = '';
  selectedRole = '';
  pollingInterval: any;
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalUsers = 0;

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
      const data = this.wsService.users();
      console.log('🔥 Temps réel:', data);
      if (data.length > 0) {
        this.users.set(data);
        this.totalUsers = data.length;
        this.applyFilters();
      }
    });
  }

  ngOnInit() {
    this.adminName = this.authService.currentUser()?.username || 'Admin';
    this.loadUsers();

    // Polling toutes les 15 secondes pour les mises à jour
    // this.pollingInterval = setInterval(() => {
    //   this.loadUsers();
    // }, 15000);
  }

  ngOnDestroy() {
    // if (this.pollingInterval) {
    //   clearInterval(this.pollingInterval);
    // }
    this.wsService.disconnect();
  }

  loadUsers() {
    this.isLoading = true;
    this.http.get<User[]>(`${this.apiUrl}/admin/users`).subscribe({
      next: (data) => {
        this.users.set(data);
        this.totalUsers = data.length;
        this.applyFilters();
        this.isLoading = false;
        console.log("users: ", this.users());
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    const allUsers = this.users();

    let filtered = allUsers.filter(user => {
      const matchesSearch =
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = this.selectedRole === '' || user.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });

    this.totalUsers = filtered.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredUsers.set(filtered.slice(startIndex, startIndex + this.itemsPerPage));
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterByRole(role: string) {
    this.selectedRole = role;
    this.currentPage = 1;
    this.applyFilters();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-danger';
      case 'CLIENT':
        return 'bg-primary';
      case 'PHARMACIST':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'CLIENT':
        return 'Patient';
      case 'PHARMACIST':
        return 'Pharmacien';
      default:
        return role;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  getTotalPages(): number {
    return Math.ceil(this.users().length / this.itemsPerPage);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
