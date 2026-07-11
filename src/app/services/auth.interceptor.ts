import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthenticationService } from './auth.service';
import { AUTH_RETRIED_AFTER_REFRESH } from './auth-http.context';

/** Interceptor principal (equivalente a InterceptService de Komanda). */
@Injectable()
export class InterceptService implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private readonly auth: AuthenticationService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isFaceAuthHost(req.url)) {
      return next.handle(req);
    }

    let outgoing = req;
    const token = this.auth.getToken();

    if (token && this.shouldAttachAuthorization(req.url)) {
      outgoing = this.addBearer(outgoing, token);
    }

    if (!(outgoing.body instanceof FormData) && !outgoing.headers.has('Content-Type')) {
      outgoing = outgoing.clone({
        setHeaders: { 'Content-Type': 'application/json' },
      });
    }

    return next.handle(outgoing).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldAttemptRefresh(error, outgoing)) {
          return this.handle401Error(outgoing, next, error);
        }
        return throwError(() => error);
      }),
    );
  }

  private shouldAttachAuthorization(url: string): boolean {
    const path = this.requestPath(url);
    const isLoginAuthEndpoint =
      /\/login(\/|$)/.test(path) && !path.includes('/login/me');
    return !isLoginAuthEndpoint || path.includes('/login/me');
  }

  private shouldAttemptRefresh(error: HttpErrorResponse, req: HttpRequest<unknown>): boolean {
    if (error.status !== 401) return false;
    if (req.context.get(AUTH_RETRIED_AFTER_REFRESH)) return false;
    if (this.isAuthEndpoint(req.url)) return false;
    return true;
  }

  private handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    originalError: HttpErrorResponse,
  ): Observable<HttpEvent<unknown>> {
    const refresh = this.auth.getRefreshToken();
    if (!refresh) {
      this.auth.recoverCurrentView();
      return throwError(() => originalError);
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refreshToken().pipe(
        switchMap((resp) => {
          const newToken =
            this.readAccessFromResponse(resp) || this.auth.getToken();
          if (!newToken) {
            this.refreshTokenSubject.next('');
            this.auth.recoverCurrentView();
            return throwError(() => originalError);
          }
          this.refreshTokenSubject.next(newToken);
          return next.handle(
            this.addBearer(req, newToken).clone({
              context: req.context.set(AUTH_RETRIED_AFTER_REFRESH, true),
            }),
          );
        }),
        catchError((refreshErr) => {
          this.refreshTokenSubject.next('');
          this.auth.recoverCurrentView();
          return throwError(() => refreshErr);
        }),
        finalize(() => {
          this.isRefreshing = false;
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((token) => {
        if (!token) {
          return throwError(() => originalError);
        }
        return next.handle(
          this.addBearer(req, token).clone({
            context: req.context.set(AUTH_RETRIED_AFTER_REFRESH, true),
          }),
        );
      }),
    );
  }

  private readAccessFromResponse(resp: unknown): string {
    if (!resp || typeof resp !== 'object') return '';
    const r = resp as Record<string, unknown>;
    const data = r['data'];
    const src =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : r;
    const v = src['token'] || src['accessToken'] || src['access_token'];
    return typeof v === 'string' ? v : '';
  }

  private addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private isAuthEndpoint(url: string): boolean {
    const path = this.requestPath(url);
    if (path.includes('/login/me')) return false;
    return /\/login(\/|$)/.test(path);
  }

  private isFaceAuthHost(url: string): boolean {
    return url.includes('faceauth.ddns.net');
  }

  private requestPath(url: string): string {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return new URL(url).pathname || '';
      }
    } catch {
      /* relativa */
    }
    const q = url.indexOf('?');
    const base = q === -1 ? url : url.slice(0, q);
    return base.startsWith('/') ? base : `/${base}`;
  }
}

/** Alias para compatibilidad con app.config existente. */
export { InterceptService as AuthInterceptor };
