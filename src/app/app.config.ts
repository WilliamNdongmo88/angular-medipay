import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // C'EST CETTE LIGNE QUI ACTIVE L'INTERCEPTEUR
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

