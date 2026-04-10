import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    //provideZoneChangeDetection({ eventCoalescing: true } ),
    provideRouter(routes),

    // C'EST CETTE LIGNE QUI ACTIVE L'INTERCEPTEUR
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

