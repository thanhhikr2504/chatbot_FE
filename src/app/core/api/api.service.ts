import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ParamsLike = Record<string, string | number | boolean | undefined | null>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: ParamsLike): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toHttpParams(params) });
  }

  post<T>(path: string, body: unknown, params?: ParamsLike): Observable<T> {
    return this.http.post<T>(this.url(path), body, { params: this.toHttpParams(params) });
  }

  put<T>(path: string, body: unknown, params?: ParamsLike): Observable<T> {
    return this.http.put<T>(this.url(path), body, { params: this.toHttpParams(params) });
  }

  patch<T>(path: string, body: unknown, params?: ParamsLike): Observable<T> {
    return this.http.patch<T>(this.url(path), body, { params: this.toHttpParams(params) });
  }

  delete<T>(path: string, params?: ParamsLike): Observable<T> {
    return this.http.delete<T>(this.url(path), { params: this.toHttpParams(params) });
  }

  private url(path: string): string {
    if (path.startsWith('http')) return path;
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  private toHttpParams(params?: ParamsLike): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
