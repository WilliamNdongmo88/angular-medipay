import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
} )
export class RegisterComponent {
  private http = inject(HttpClient );
  private router = inject(Router);

  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ROLE_CLIENT' // Par défaut, on inscrit un Patient
  };

  isSubmitting = signal<boolean>(false);
  errorMessage = '';
  successMessage = '';

    private apiUrl: string | undefined;
    private isProd = environment.production;

    constructor() {
      // Définir l'URL de l'API selon l'environnement
      if (this.isProd) {
        this.apiUrl = environment.apiUrlProd;
      } else {
        this.apiUrl = environment.apiUrlDev;
      }
    }

  onRegister() {
    // 1. Validation simple des mots de passe
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = '';

    // 2. Envoi au backend (Endpoint : /api/auth/register)
    const { confirmPassword, ...payload } = this.registerData;
    console.log("Payload d'inscription :", payload);
    this.http.post(`${this.apiUrl}/auth/signup`, payload ).subscribe({
      next: () => {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.successMessage = "Inscription réussie ! Redirection vers la page de connexion...";
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Une erreur est survenue lors de l'inscription.";
        this.isSubmitting.set(false);
      }
    });
  }
}
