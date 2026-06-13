import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  nombreEmpresa: string;
  rucCuit: string;
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  usuarioId: string;
  nombre: string;
  email: string;
  rol: string;
  tenantId: string;
  nombreEmpresa: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:5075/api/Auth';
  private readonly TOKEN_KEY = 'jujuy_erp_token';
  private readonly USER_KEY = 'jujuy_erp_user';

  private _currentUser = signal<AuthResponse | null>(this.loadUserFromStorage());
  private _token       = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  readonly currentUser     = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly token           = this._token.asReadonly();

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, request).pipe(
      tap(response => this.persist(response))
    );
  }

  registerComercio(nombreComercio: string, adminEmail: string, adminPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register-tenant`, {
      nombreComercio,
      adminEmail,
      adminPassword
    });
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, request).pipe(
      tap(response => this.persist(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this._token.set(null);
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this._currentUser.set(response);
    this._token.set(response.token);
  }

  private loadUserFromStorage(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
