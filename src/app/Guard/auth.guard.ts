import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Vérifier si l'utilisateur est connecté (présence du token)
  if (authService.isLoggedIn()) {
    const user = authService.currentUser();
    console.log('Rôle de l\'utilisateur :', user?.role);

    // 2. Vérifier si la route nécessite un rôle spécifique (ex: ADMIN)
    const expectedRole = route.data['role'];

    if (expectedRole && user?.role !== expectedRole) {
      // Si le rôle ne correspond pas, redirection vers le login ou une page non autorisée
      console.log('Rôle de l\'utilisateur :', user?.role);
      console.warn('Accès refusé : Rôle insuffisant');
      router.navigate(['/login']);
      return false;
    }

    return true; // Accès autorisé
  }

  // 3. Si non connecté, redirection vers login avec l'URL de retour
  console.warn('Accès refusé : Non authentifié');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

