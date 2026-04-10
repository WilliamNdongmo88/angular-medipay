import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { PharmacistDashboardComponent } from './components/pharmacist-dashboard/pharmacist-dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'pharmacist', component: PharmacistDashboardComponent },
  { path: 'client', component: ClientDashboardComponent },
  { path: '**', redirectTo: 'login' }
  // Les autres routes seront ajoutées ici (Admin, Client, Pharmacist)
];
