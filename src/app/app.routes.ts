import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin/admin-dashboard.component';
import { PharmacistDashboardComponent } from './components/pharmacist-dashboard/pharmacist-dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { TransactionHistoryComponent } from './components/admin-dashboard/transaction/transaction-history.component';
import { UserManagementComponent } from './components/admin-dashboard/users/user-management.component';
import { authGuard } from './Guard/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ProfileComponent } from './components/profile/profile.component';
// import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'pharmacist', component: PharmacistDashboardComponent },
  { path: 'client', component: ClientDashboardComponent },
    {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard], // Protection active
    data: { role: 'ROLE_ADMIN' }   // On précise le rôle requis
  },
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [authGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  {
    path: 'admin/transactions',
    component: TransactionHistoryComponent,
    canActivate: [authGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: 'admin/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { role: 'ROLE_ADMIN' }
  },
  // {
  //   path: 'admin/settings',
  //   component: SettingsComponent,
  //   canActivate: [authGuard],
  //   data: { role: 'ROLE_ADMIN' }
  // },
  {
    path: 'client/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { role: 'ROLE_CLIENT' }
  },
  {
    path: 'pharmacist/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { role: 'ROLE_PHARMACIST' }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
  // Les autres routes seront ajoutées ici (Admin, Client, Pharmacist)
];
