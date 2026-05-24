import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'chat'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('../features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('../features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/chat/chat-shell/chat-shell.component').then((m) => m.ChatShellComponent)
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];
