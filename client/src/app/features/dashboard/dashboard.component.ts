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
        <h1 class="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p class="text-sm text-neutral-500 mt-1">Resumen operativo en tiempo real</p>
      </div>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800/50 animate-pulse">
              <div class="h-3 w-20 bg-neutral-800 rounded mb-5"></div>
              <div class="h-7 w-28 bg-neutral-800/70 rounded"></div>
            </div>
          }
        </div>
      } @else if (metricas()) {

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

          <div class="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-5
                      hover:border-emerald-500/30 hover:bg-neutral-900/80 transition-all duration-300 group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Ventas Hoy</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                          flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-white tabular-nums">
              {{ metricas()!.totalVentasDia | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-emerald-400/80 font-medium mt-1.5">Acumulado del día</p>
          </div>

          <div class="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-5
                      hover:border-blue-500/30 hover:bg-neutral-900/80 transition-all duration-300 group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Inversión</span>
              <div class="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20
                          flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-white tabular-nums">
              {{ metricas()!.inversionStock | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-blue-400/80 font-medium mt-1.5">Costo × stock actual</p>
          </div>

          <div class="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-5
                      hover:border-violet-500/30 hover:bg-neutral-900/80 transition-all duration-300 group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Ganancia Potencial</span>
              <div class="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-white tabular-nums">
              {{ metricas()!.gananciaProyectada | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-xs text-violet-400/80 font-medium mt-1.5">Margen en góndola</p>
          </div>

          <div class="backdrop-blur-md rounded-2xl p-5 transition-all duration-300 group"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'bg-red-950/40 border border-red-500/30 hover:border-red-400/50'
                 : 'bg-neutral-900/60 border border-neutral-800/50 hover:border-neutral-700/60'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[11px] font-semibold uppercase tracking-widest"
                    [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-400' : 'text-neutral-500'">
                Alertas
              </span>
              <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                   [class]="metricas()!.productosCriticosCount > 0
                     ? 'bg-red-500/20 animate-pulse border border-red-500/30'
                     : 'bg-neutral-800 border border-neutral-700/50'">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-400' : 'text-neutral-500'">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black tabular-nums"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-300' : 'text-white'">
              {{ metricas()!.productosCriticosCount }}
            </p>
            <p class="text-xs font-medium mt-1.5"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-400/80' : 'text-neutral-500'">
              {{ metricas()!.productosCriticosCount > 0 ? 'Productos bajo stock mínimo' : 'Sin alertas activas' }}
            </p>
          </div>

        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          @for (action of quickActions; track action.route) {
            <a [routerLink]="action.route"
              class="flex items-center gap-4 bg-neutral-900/40 backdrop-blur-sm rounded-2xl p-5
                     border border-neutral-800/50 hover:bg-neutral-900/70
                     transition-all duration-300 ease-in-out group cursor-pointer">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          transition-all duration-300 group-hover:scale-110"
                   [style]="'background: ' + action.bg">
                <span [innerHTML]="action.icon" class="w-5 h-5 block"></span>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {{ action.label }}
                </p>
                <p class="text-xs text-neutral-500 mt-0.5">{{ action.sub }}</p>
              </div>
            </a>
          }
        </div>

      }

      @if (error()) {
        <div class="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p class="text-sm text-red-400">{{ error() }}</p>
          <button (click)="cargarMetricas()"
            class="ml-auto text-xs font-medium text-red-400 hover:text-red-300 transition-colors underline">
            Reintentar
          </button>
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

  readonly quickActions = [
    {
      route: '/ventas',
      label: 'Nueva Venta',
      sub:   'Punto de Venta',
      bg:    'rgba(99,102,241,0.15)',
      icon:  `<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`
    },
    {
      route: '/productos',
      label: 'Inventario',
      sub:   'Gestionar stock',
      bg:    'rgba(59,130,246,0.15)',
      icon:  `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`
    },
    {
      route: '/ventas/historial',
      label: 'Historial',
      sub:   'Ventas registradas',
      bg:    'rgba(16,185,129,0.15)',
      icon:  `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
    }
  ];

  ngOnInit(): void { this.cargarMetricas(); }

  cargarMetricas(): void {
    this.cargando.set(true);
    this.error.set('');
    this.http.get<MetricasDashboard>(this.API).subscribe({
      next:  data => { this.metricas.set(data); this.cargando.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las métricas.'); this.cargando.set(false); }
    });
  }
}
