import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  onLogin(event: Event) {
    event.preventDefault();
    this.isLoading = true;
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
        this.isLoading = false;
        this.errorMessage = "Identifiants invalides ou erreur serveur.";
      }
    });
  }
}
