import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
} )
export class ForgotPasswordComponent {
  private http = inject(HttpClient );
  private router = inject(Router);

  step: number = 1; // 1: Saisie Email, 2: Nouveau Mot de Passe
  email: string = '';
  newPasswordData = {
    password: '',
    confirmPassword: ''
  };

  isLoading = signal(false);
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

  // ÉTAPE 1 : Valider l'email
  onVerifyEmail() {
    this.isLoading.set(true);
    this.errorMessage = '';

    // Appel API pour vérifier si l'email existe
    this.http.post(`${this.apiUrl}/auth/verify-email`, { email: this.email } ).subscribe({
      next: () => {
        this.step = 2; // On passe à la saisie du nouveau mot de passe
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Cet email n'est pas reconnu dans notre système.";
        this.isLoading.set(false);
      }
    });
  }

  // ÉTAPE 2 : Réinitialiser le mot de passe
  onResetPassword() {
    if (this.newPasswordData.password !== this.newPasswordData.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }

    this.isLoading.set(true);
    this.errorMessage = '';

    const payload = {
      email: this.email,
      newPassword: this.newPasswordData.password
    };

    this.http.post(`${this.apiUrl}/auth/reset-password`, payload ).subscribe({
      next: () => {
        this.successMessage = "Votre mot de passe a été réinitialisé avec succès !";
        this.isLoading.set(false);
        // Redirection vers le login après 3 secondes
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Une erreur est survenue lors de la réinitialisation.";
        this.isLoading.set(false);
      }
    });
  }
}
