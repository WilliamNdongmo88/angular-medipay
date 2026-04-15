import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
} )
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient );
  private authService = inject(AuthService);

  apiUrl = environment.production ? environment.apiUrlProd : environment.apiUrlDev;
  user: any = null;
  isLoading = true;
  currentUser: any = null;

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.user = this.authService.currentUser();
    console.log('Utilisateur actuel:', this.currentUser);
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      //this.router.navigate(['/client']); // fallback
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
