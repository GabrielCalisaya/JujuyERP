import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface Producto {
  id: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="min-h-screen bg-slate-50">

      <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <span class="font-bold text-slate-800 text-sm sm:text-base">JujuyERP</span>
              <span class="hidden sm:inline text-slate-400 mx-2">·</span>
              <span class="hidden sm:inline text-slate-500 text-sm">Gestión de Stock</span>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <span class="hidden md:block text-sm text-slate-500">
              {{ auth.currentUser()?.nombreEmpresa }}
            </span>
            <button
              (click)="logout()"
              class="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg
                     hover:bg-slate-100 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Catálogo de Productos</h2>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ productos().length }} producto{{ productos().length !== 1 ? 's' : '' }} en stock
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              (click)="aplicarAumentoMasivo()"
              [disabled]="actualizando()"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                     bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white
                     shadow-md shadow-amber-200 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
              @if (actualizando()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Actualizando...
              } @else {
                <span>⚡</span>
                <span>Aplicar Aumento Masivo (+10%)</span>
              }
            </button>
          </div>
        </div>

        @if (errorMsg()) {
          <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <svg class="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm text-red-600">{{ errorMsg() }}</p>
          </div>
        }

        @if (successMsg()) {
          <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
            <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm text-emerald-700">{{ successMsg() }}</p>
          </div>
        }

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          @if (cargando()) {
            <div class="flex items-center justify-center py-24">
              <svg class="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else if (productos().length === 0) {
            <div class="flex flex-col items-center justify-center py-24 text-slate-400">
              <svg class="w-14 h-14 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="font-medium text-slate-500">Sin productos registrados</p>
              <p class="text-sm mt-1">Agregá tu primer producto para comenzar.</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-100 bg-slate-50/60">
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Cód. Barras</th>
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Nombre</th>
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Descripción</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Costo</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Precio Venta</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Stock</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of productos(); track p.id) {
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="px-5 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {{ p.codigoBarras ?? '—' }}
                      </td>
                      <td class="px-5 py-4 font-medium text-slate-800">{{ p.nombre }}</td>
                      <td class="px-5 py-4 text-slate-500 hidden lg:table-cell max-w-xs truncate">
                        {{ p.descripcion ?? '—' }}
                      </td>
                      <td class="px-5 py-4 text-right text-slate-500 tabular-nums whitespace-nowrap">
                        {{ p.costo | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-5 py-4 text-right font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {{ p.precioVenta | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-5 py-4 text-right whitespace-nowrap">
                        <span [class]="p.stockActual <= p.stockMinimo
                          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
                          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700'">
                          {{ p.stockActual }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </main>
    </div>
  `
})
export class ProductosComponent implements OnInit {
  private http   = inject(HttpClient);
  readonly auth  = inject(AuthService);
  private router = inject(Router);

  private readonly API = 'http://localhost:5075/api';

  productos   = signal<Producto[]>([]);
  cargando    = signal(true);
  actualizando = signal(false);
  errorMsg    = signal('');
  successMsg  = signal('');

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.errorMsg.set('');

    this.http.get<Producto[]>(`${this.API}/productos`).subscribe({
      next: data => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      }
    });
  }

  aplicarAumentoMasivo(): void {
    this.actualizando.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.http
      .put<{ productosActualizados: number }>(
        `${this.API}/productos/actualizar-precios-masivo`,
        { porcentajeAumento: 10.0 }
      )
      .subscribe({
        next: res => {
          this.successMsg.set(
            `✓ Aumento aplicado a ${res.productosActualizados} producto${res.productosActualizados !== 1 ? 's' : ''}.`
          );
          this.actualizando.set(false);
          this.cargarProductos();
        },
        error: () => {
          this.errorMsg.set('No se pudo aplicar el aumento masivo.');
          this.actualizando.set(false);
        }
      });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
