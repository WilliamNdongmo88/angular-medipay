import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = signal(false);
  errorMessage = '';

  onLogin(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        // Redirection intelligente selon le rôle
        if (user?.role === 'ROLE_ADMIN') this.router.navigate(['/admin']);
        else if (user?.role === 'ROLE_PHARMACIST') this.router.navigate(['/pharmacist']);
        else this.router.navigate(['/client']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage = "Identifiants invalides ou erreur serveur.";
      }
    });
  }
}
