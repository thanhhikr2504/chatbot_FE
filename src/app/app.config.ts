import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/auth.interceptor';

class GlobalErrorHandler implements ErrorHandler {
  private snackBar = inject(MatSnackBar);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
    this.snackBar.open(message, 'Đóng', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
