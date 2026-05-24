import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from '../api/api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../shared/models';

const TOKEN_KEY = 'chatbot.token';
const USER_KEY = 'chatbot.user';

interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<User | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !this.isTokenExpired(this._token()));

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return this._token();
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);

    const decoded = this.decodeJwt(res.token);
    const user: User = res.user ?? {
      id: decoded?.sub ?? '',
      email: decoded?.email ?? '',
      displayName: decoded?.name
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(res.token);
    this._user.set(user);
  }

  private readStoredToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || this.isTokenExpired(token)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    const payload = this.decodeJwt(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 < Date.now();
  }
}
