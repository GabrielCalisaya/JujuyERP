import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface MetricasDashboard {
  totalVentasDia: number;
  inversionStock: number;
  gananciaProyectada: number;
  productosCriticosCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto">

      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p class="text-sm text-slate-500 mt-1">Resumen operativo en tiempo real</p>
      </div>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
              <div class="h-4 w-24 bg-slate-200 rounded mb-4"></div>
              <div class="h-8 w-32 bg-slate-100 rounded"></div>
            </div>
          }
        </div>
      } @else if (metricas()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm
                      hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ventas de Hoy
              </span>
              <div class="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-slate-800 tabular-nums">
              {{ metricas()!.totalVentasDia | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-emerald-600 font-medium mt-1">Acumulado del día</p>
          </div>

          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm
                      hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Inversión en Stock
              </span>
              <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-slate-800 tabular-nums">
              {{ metricas()!.inversionStock | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-blue-600 font-medium mt-1">Costo × stock actual</p>
          </div>

          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm
                      hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ganancia Potencial
              </span>
              <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-slate-800 tabular-nums">
              {{ metricas()!.gananciaProyectada | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-indigo-600 font-medium mt-1">Margen en góndola</p>
          </div>

          <div class="rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'bg-red-50 border-red-200'
                 : 'bg-white border-slate-200'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold uppercase tracking-wide"
                    [class]="metricas()!.productosCriticosCount > 0
                      ? 'text-red-600'
                      : 'text-slate-500'">
                Alertas Críticas
              </span>
              <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                   [class]="metricas()!.productosCriticosCount > 0
                     ? 'bg-red-200 animate-pulse'
                     : 'bg-slate-100'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     [class]="metricas()!.productosCriticosCount > 0
                       ? 'text-red-600'
                       : 'text-slate-400'">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black tabular-nums"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'text-red-700'
                 : 'text-slate-800'">
              {{ metricas()!.productosCriticosCount }}
            </p>
            <p class="text-xs font-medium mt-1"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'text-red-500'
                 : 'text-slate-400'">
              {{ metricas()!.productosCriticosCount > 0 ? 'Productos bajo stock mínimo' : 'Sin alertas activas' }}
            </p>
          </div>

        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a routerLink="/ventas"
            class="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-200
                   hover:border-indigo-300 hover:shadow-md transition-all group">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-600
                        flex items-center justify-center transition-colors shrink-0">
              <svg class="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Nueva Venta</p>
              <p class="text-xs text-slate-400">Ir al Punto de Venta</p>
            </div>
          </a>
          <a routerLink="/productos"
            class="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-200
                   hover:border-blue-300 hover:shadow-md transition-all group">
            <div class="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-600
                        flex items-center justify-center transition-colors shrink-0">
              <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Agregar Producto</p>
              <p class="text-xs text-slate-400">Ir al Inventario</p>
            </div>
          </a>
          <a routerLink="/ventas/historial"
            class="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-200
                   hover:border-emerald-300 hover:shadow-md transition-all group">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-600
                        flex items-center justify-center transition-colors shrink-0">
              <svg class="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Ver Historial</p>
              <p class="text-xs text-slate-400">Ventas registradas</p>
            </div>
          </a>
        </div>
      }

      @if (error()) {
        <div class="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p class="text-sm text-red-600">{{ error() }}</p>
          <button (click)="cargarMetricas()"
            class="ml-auto text-xs font-medium text-red-600 underline">Reintentar</button>
        </div>
      }

    </div>
  `
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:5075/api/dashboard/metricas';

  metricas = signal<MetricasDashboard | null>(null);
  cargando = signal(true);
  error    = signal('');

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando.set(true);
    this.error.set('');
    this.http.get<MetricasDashboard>(this.API).subscribe({
      next:  data => { this.metricas.set(data); this.cargando.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las métricas.'); this.cargando.set(false); }
    });
  }
}
