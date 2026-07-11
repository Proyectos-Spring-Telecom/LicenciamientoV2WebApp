import { Injectable } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  Subject,
  of,
  switchMap,
  tap,
  map,
  catchError,
  throwError,
  finalize,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../entities/User';
import { Credentials } from '../entities/Credentials';
import { BaseServicesService } from './base.service';

interface AuthTokenResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  permisos?: unknown[];
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Auth JWT: POST/GET/POST/POST bajo {API_SECURITY}/login*.
 * sessionStorage: token, refreshToken, user, permissions.
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationService extends BaseServicesService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REFRESH_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';
  private static readonly PERMISSIONS_KEY = 'permissions';
  private static readonly COORDINATES_KEY = 'coordinates';

  private readonly authenticationChanged = new Subject<boolean>();
  private user: User | null = null;
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');
  /** Sin interceptores: refresh/logout no deben reintentar refresh. */
  private readonly rawHttp: HttpClient;

  constructor(
    private http: HttpClient,
    httpBackend: HttpBackend,
    private router: Router,
  ) {
    super();
    this.rawHttp = new HttpClient(httpBackend);
  }

  /** POST {API_SECURITY}/login?Nombres={solución activa} */
  login(body: { userName: string; password: string }): Observable<User> {
    const solucion =
      String(environment.loginSolucionNombre ?? 'NXT').trim() || 'NXT';
    const params = new HttpParams().set('Nombres', solucion);

    return this.http
      .post<AuthTokenResponse>(`${this.baseUrl}/login`, body, { params })
      .pipe(
      tap((loginResp) => {
        this.cleanSession();
        this.setTokenPairFromAuthResponse(loginResp);
      }),
      switchMap((loginResp) =>
        this.me().pipe(
          map((meResp) => this.mergeLoginWithMe(loginResp, meResp)),
          tap((merged) => this.setData(merged)),
        ),
      ),
      catchError((err) => this.handleError(err)),
      );
  }

  /** GET {API_SECURITY}/login/me — Bearer obligatorio (interceptor o header explícito). */
  me(accessToken?: string): Observable<AuthTokenResponse> {
    const token = accessToken?.trim() || this.getToken();
    const options = token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
    return this.http.get<AuthTokenResponse>(`${this.baseUrl}/login/me`, options);
  }

  /** POST {API_SECURITY}/login/refresh — body { refreshToken }, sin Bearer. */
  refreshToken(): Observable<AuthTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refreshToken available'));
    }
    return this.rawHttp
      .post<AuthTokenResponse>(
        `${this.baseUrl}/login/refresh`,
        { refreshToken },
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
      )
      .pipe(tap((resp) => this.setTokenPairFromAuthResponse(resp)));
  }

  /** POST {API_SECURITY}/login/logout — siempre limpia sesión en finalize. */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.cleanSession();
      this.navigateToLogin();
      return of(void 0);
    }

    return this.rawHttp
      .post(
        `${this.baseUrl}/login/logout`,
        { refreshToken },
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
      )
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
        finalize(() => {
          this.cleanSession();
          this.navigateToLogin();
        }),
      );
  }

  /** Invalida refresh al entrar a login con sesión previa (app shell). */
  logoutOnLoginScreen(): void {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.cleanSession();
      return;
    }
    this.rawHttp
      .post(
        `${this.baseUrl}/login/logout`,
        { refreshToken },
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
      )
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.cleanSession()),
      )
      .subscribe();
  }

  recoverCurrentView(): void {
    void import('sweetalert2').then(({ default: Swal }) => {
      void Swal.fire({
        icon: 'warning',
        title: 'Sesión Expirada',
        background: '#141a21',
        color: '#f4f6ff',
        text: 'Vuelve a iniciar sesión para continuar.',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      }).then(() => {
        this.cleanSession();
        globalThis.location.reload();
      });
    });
  }

  setTokenPairFromAuthResponse(resp: AuthTokenResponse | User | null | undefined): void {
    const token = this.extractToken(resp);
    const refreshToken = this.extractRefreshToken(resp);
    if (token) {
      this.writeStorage(AuthenticationService.TOKEN_KEY, token);
    }
    if (refreshToken) {
      this.writeStorage(AuthenticationService.REFRESH_KEY, refreshToken);
    }
    this.authenticationChanged.next(this.isAuthenticated());
  }

  setData(user: User): void {
    const normalized = this.normalizeUserForStorage(user);
    const token = this.getToken() || normalized.token || '';
    if (token) {
      normalized.token = token;
      this.writeStorage(AuthenticationService.TOKEN_KEY, token);
    }
    const refresh = this.getRefreshToken() || normalized.refreshToken || '';
    if (refresh) {
      normalized.refreshToken = refresh;
      this.writeStorage(AuthenticationService.REFRESH_KEY, refresh);
    }
    this.user = normalized;
    sessionStorage.setItem(
      AuthenticationService.USER_KEY,
      JSON.stringify(normalized),
    );
    this.setStoragePermissions(normalized.permisos || []);
    this.authenticationChanged.next(this.isAuthenticated());
  }

  /** Fusiona /me sobre sesión actual sin perder token ni campos solo del login. */
  mergeSessionUserFromMe(meResp: AuthTokenResponse | User): User {
    const current = this.getUser() ?? ({} as User);
    const meUser = this.unwrapAuthUser(meResp);
    const merged = this.mergeLoginWithMe(
      { user: current, permisos: current.permisos } as AuthTokenResponse,
      meResp,
    );
    this.setData(merged);
    return merged;
  }

  getPostLoginCommands(_user?: User | null): string[] {
    return ['/local-comercial/lista-local-comercial'];
  }

  getIdRolUsuarioLogueado(user?: User | null): number {
    const u = user ?? this.getUser();
    if (!u) return 0;
    const inner = u.user as Record<string, unknown> | undefined;
    const rol = u.rol as { id?: number } | undefined;
    const innerRol = inner?.['rol'] as { id?: number } | undefined;
    const raw =
      u.idRol ??
      rol?.id ??
      inner?.['idRol'] ??
      innerRol?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && token !== 'null' && token !== 'undefined';
  }

  /** Compatibilidad: el refresh en curso lo gestiona el interceptor (sin flag en cliente). */
  isRefreshBlocked(): boolean {
    return false;
  }

  isAuthenticationChanged(): Observable<boolean> {
    return this.authenticationChanged.asObservable();
  }

  getToken(): string {
    return this.readStorage(AuthenticationService.TOKEN_KEY);
  }

  getRefreshToken(): string {
    return this.readStorage(AuthenticationService.REFRESH_KEY);
  }

  getUser(): User | null {
    if (this.user) return this.user;
    const raw = sessionStorage.getItem(AuthenticationService.USER_KEY);
    if (!raw) return null;
    try {
      this.user = JSON.parse(raw) as User;
      return this.user;
    } catch {
      return null;
    }
  }

  getPermissions(): string[] {
    const raw = sessionStorage.getItem(AuthenticationService.PERMISSIONS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  getCoordinates(): unknown {
    const raw = sessionStorage.getItem(AuthenticationService.COORDINATES_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setStorageCoordinate(coordinates: unknown): void {
    sessionStorage.setItem(
      AuthenticationService.COORDINATES_KEY,
      JSON.stringify(coordinates),
    );
  }

  cleanSession(): void {
    sessionStorage.clear();
    this.user = null;
    this.authenticationChanged.next(false);
  }

  clearSessionOnly(): void {
    this.cleanSession();
  }

  clearSessionAndRedirect(): void {
    this.cleanSession();
    this.navigateToLogin();
  }

  /** Compatibilidad con código existente. */
  authenticate(body: Credentials): Observable<User> {
    const userName = body.userName ?? body.username ?? '';
    return this.login({ userName, password: body.password });
  }

  updatePassword(payload: {
    password: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/usuarios/update/password`, {
      ...payload,
      validPassword: true,
    });
  }

  recuperarAcceso(data: { userName: string }): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/usuarios/forgot-password`,
      data,
      { responseType: 'text' as 'json' },
    );
  }

  reenviarCodigo(payload: { codigo: string }): Observable<string> {
    return this.http.patch<string>(
      `${this.baseUrl}/login/verify`,
      payload,
      { responseType: 'text' as 'json' },
    );
  }

  cambiarPasswordConToken(token: string, nuevaPassword: string): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/usuarios/updateForgotPassword`, {
      token,
      nuevaPassword,
    });
  }

  updateUsuario(id: string, form: unknown): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/controlusuarios/${id}`, form);
  }

  getUsuarioControl(id: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/controlusuarios/${id}`);
  }

  failToken(): void {
    this.cleanSession();
  }

  clearUserData(): void {
    this.cleanSession();
  }

  needsPasswordChange(user?: User | null): boolean {
    const u = user ?? this.getUser();
    if (!u) return false;
    const inner = (u.user ?? u) as Record<string, unknown>;
    return inner['validPassword'] === false || u['validPassword' as keyof User] === false;
  }

  private mergeLoginWithMe(
    loginResp: AuthTokenResponse,
    meResp: AuthTokenResponse | User,
  ): User {
    const loginPayload = this.unwrapAuthUser(loginResp);
    const mePayload = this.unwrapAuthUser(meResp);
    const loginInner = (loginPayload['user'] ?? loginPayload) as Record<string, unknown>;
    const meInner = (mePayload['user'] ?? mePayload) as Record<string, unknown>;
    const validPassword =
      loginInner['validPassword'] ??
      loginPayload['validPassword' as keyof typeof loginPayload];

    const mergedInner: Record<string, unknown> = {
      ...loginInner,
      ...meInner,
      validPassword,
    };

    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const permisos =
      (mePayload['permisos'] as unknown[]) ??
      (loginPayload['permisos'] as unknown[]) ??
      (mergedInner['permisos'] as unknown[]) ??
      [];

    return {
      ...(mePayload as User),
      ...(loginPayload as User),
      ...mergedInner,
      token,
      refreshToken,
      user: mergedInner,
      permisos,
    } as User;
  }

  private normalizeUserForStorage(user: User): User {
    const copy: User = { ...user };
    if (Array.isArray(copy.permisos)) {
      copy.permisos = copy.permisos.map((p) => {
        if (p && typeof p === 'object') {
          const row = p as Record<string, unknown>;
          const id = row['idPermiso'] ?? row['IdPermiso'] ?? row['id'] ?? row['Id'];
          return id != null ? { ...row, idPermiso: id } : p;
        }
        return p;
      });
    }
    const nombreSucursal = this.resolveNombreSucursal(copy);
    if (nombreSucursal) {
      (copy as Record<string, unknown>)['nombreSucursal'] = nombreSucursal;
      const inner = (copy.user ?? copy) as Record<string, unknown>;
      inner['nombreSucursal'] = nombreSucursal;
    }
    return copy;
  }

  private resolveNombreSucursal(user: User): string {
    const u = user as Record<string, unknown>;
    const inner = (user.user ?? user) as Record<string, unknown>;
    const suc = inner['sucursal'] as Record<string, unknown> | undefined;
    const candidates = [
      u['nombreSucursal'],
      u['NombreSucursal'],
      inner['nombreSucursal'],
      inner['NombreSucursal'],
      suc?.['nombre'],
      suc?.['Nombre'],
    ];
    for (const c of candidates) {
      const s = String(c ?? '').trim();
      if (s) return s;
    }
    return '';
  }

  private unwrapAuthUser(resp: AuthTokenResponse | User): Record<string, unknown> {
    if (!resp || typeof resp !== 'object') return {};
    const r = resp as Record<string, unknown>;
    const data = r['data'];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return r;
  }

  private setStoragePermissions(permissions: unknown[]): void {
    const permissionIds = (permissions || []).map((perm) => {
      if (perm && typeof perm === 'object') {
        const row = perm as Record<string, unknown>;
        const id = row['idPermiso'] ?? row['IdPermiso'] ?? row['id'] ?? row['Id'];
        return id != null ? String(id) : '';
      }
      return String(perm);
    }).filter(Boolean);

    sessionStorage.setItem(
      AuthenticationService.PERMISSIONS_KEY,
      JSON.stringify(permissionIds),
    );
  }

  private extractToken(payload: unknown): string {
    return (
      this.readAccessToken(this.unwrapAuthUser(payload as AuthTokenResponse)) ||
      this.readAccessToken(payload as Record<string, unknown>) ||
      ''
    );
  }

  private extractRefreshToken(payload: unknown): string {
    return (
      this.readRefreshToken(this.unwrapAuthUser(payload as AuthTokenResponse)) ||
      this.readRefreshToken(payload as Record<string, unknown>) ||
      ''
    );
  }

  private readAccessToken(source: Record<string, unknown>): string {
    const v =
      source['token'] || source['accessToken'] || source['access_token'] || '';
    return typeof v === 'string' ? v : '';
  }

  private readRefreshToken(source: Record<string, unknown>): string {
    const v = source['refreshToken'] || source['refresh_token'] || '';
    return typeof v === 'string' ? v : '';
  }

  private writeStorage(key: string, value: string): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  private readStorage(key: string): string {
    const raw = sessionStorage.getItem(key);
    return this.normalizeStorageValue(raw);
  }

  private normalizeStorageValue(raw: string | null): string {
    if (raw == null || raw === '' || raw === 'null' || raw === 'undefined') {
      return '';
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed == null || parsed === 'null' || parsed === 'undefined') {
        return '';
      }
      return typeof parsed === 'string' ? parsed : raw;
    } catch {
      return raw;
    }
  }

  private navigateToLogin(): void {
    const url = this.router.url || '';
    if (
      !url.startsWith('/login') &&
      !url.startsWith('/register') &&
      !url.startsWith('/solicitud-cambio-password') &&
      !url.startsWith('/cambio-password')
    ) {
      void this.router.navigate(['/login']);
    }
  }
}
