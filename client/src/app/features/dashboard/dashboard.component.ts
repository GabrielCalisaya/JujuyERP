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

interface QuickAction {
  route: string;
  label: string;
  sub: string;
  accentFrom: string;
  accentTo: string;
  dotColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto">

      <div class="mb-10">
        <h1 class="text-3xl font-bold tracking-tight
                   bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                   bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p class="text-sm text-neutral-600 mt-1.5">Resumen operativo en tiempo real</p>
      </div>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-32 rounded-2xl border border-white/[0.05] bg-[#0f1424]/40 animate-pulse"></div>
          }
        </div>
      } @else if (metricas()) {

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-emerald-500/20 transition-all duration-300 ease-out group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(16,185,129,0.05) 0%,transparent 60%)"></div>
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-3">
              Ventas Hoy
            </p>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1.5">
              {{ metricas()!.totalVentasDia | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-emerald-500/70 font-medium">Acumulado del día</p>
            <div class="absolute top-4 right-4 w-7 h-7 rounded-lg bg-emerald-500/[0.08]
                        border border-emerald-500/20 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-blue-500/20 transition-all duration-300 ease-out group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(59,130,246,0.05) 0%,transparent 60%)"></div>
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-3">
              Inversión
            </p>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1.5">
              {{ metricas()!.inversionStock | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-blue-500/70 font-medium">Costo × stock</p>
            <div class="absolute top-4 right-4 w-7 h-7 rounded-lg bg-blue-500/[0.08]
                        border border-blue-500/20 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-violet-500/20 transition-all duration-300 ease-out group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(139,92,246,0.05) 0%,transparent 60%)"></div>
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-3">
              Potencial
            </p>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1.5">
              {{ metricas()!.gananciaProyectada | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-violet-500/70 font-medium">Margen en góndola</p>
            <div class="absolute top-4 right-4 w-7 h-7 rounded-lg bg-violet-500/[0.08]
                        border border-violet-500/20 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border transition-all duration-300 ease-out
                      bg-[#0f1424]/40 backdrop-blur-xl p-5 group"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'border-red-500/25 hover:border-red-400/40'
                 : 'border-white/[0.06] hover:border-white/[0.09]'">
            @if (metricas()!.productosCriticosCount > 0) {
              <div class="absolute inset-0 animate-pulse"
                   style="background:radial-gradient(ellipse at 80% 20%,rgba(239,68,68,0.07) 0%,transparent 55%)"></div>
              <div class="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-30"
                   style="background:rgba(239,68,68,0.25)"></div>
            }
            <p class="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-500/80' : 'text-neutral-500'">
              Alertas
            </p>
            <p class="text-2xl font-black tabular-nums leading-none mb-1.5"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-300' : 'text-white'">
              {{ metricas()!.productosCriticosCount }}
            </p>
            <p class="text-[11px] font-medium"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-500/70' : 'text-neutral-600'">
              {{ metricas()!.productosCriticosCount > 0 ? 'Bajo stock mínimo' : 'Sin alertas' }}
            </p>
            <div class="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center"
                 [class]="metricas()!.productosCriticosCount > 0
                   ? 'bg-red-500/[0.1] border border-red-500/25'
                   : 'bg-white/[0.04] border border-white/[0.06]'">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-400' : 'text-neutral-600'">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>

        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          @for (a of quickActions; track a.route) {
            <a [routerLink]="a.route"
              class="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-white/[0.06]
                     bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden
                     hover:border-white/[0.09] transition-all duration-300 ease-out cursor-pointer">
              <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center
                          transition-transform duration-300 group-hover:scale-110"
                   [style]="'background:' + a.bg + ';border:1px solid ' + a.border">
                <svg class="w-4 h-4" [class]="a.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="a.iconPath"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-[13px] font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {{ a.label }}
                </p>
                <p class="text-[11px] text-neutral-600 mt-0.5">{{ a.sub }}</p>
              </div>
              <svg class="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 ml-auto shrink-0
                          transition-all duration-200 group-hover:translate-x-0.5"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          }
        </div>

      }

      @if (error()) {
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl
                    bg-red-500/[0.07] border border-red-500/20 mt-4">
          <p class="text-sm text-red-400">{{ error() }}</p>
          <button (click)="cargarMetricas()"
            class="ml-auto text-xs font-medium text-red-400/70 hover:text-red-300 transition-colors underline">
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
      route:    '/ventas',
      label:    'Nueva Venta',
      sub:      'Punto de Venta',
      bg:       'rgba(99,102,241,0.1)',
      border:   'rgba(99,102,241,0.2)',
      iconColor:'text-indigo-400',
      iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      route:    '/productos',
      label:    'Inventario',
      sub:      'Gestionar stock',
      bg:       'rgba(59,130,246,0.1)',
      border:   'rgba(59,130,246,0.2)',
      iconColor:'text-blue-400',
      iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
      route:    '/ventas/historial',
      label:    'Historial',
      sub:      'Ventas registradas',
      bg:       'rgba(16,185,129,0.1)',
      border:   'rgba(16,185,129,0.2)',
      iconColor:'text-emerald-400',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
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
