import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

interface ProductoVentasDto  { nombre: string; cantidadVendida: number; recaudacion: number; }
interface EventoActividadDto { tipo: string; descripcion: string; fecha: string; }
interface MetricasDashboard  {
  totalVentas: number; inversionStock: number; gananciaProyectada: number;
  productosCriticosCount: number; crecimientoVentas: number;
  tendenciaVentas: number[]; productosMasVendidos: ProductoVentasDto[];
  actividadReciente: EventoActividadDto[];
}

type Rango = 1 | 7 | 30;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto space-y-8">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight
                     bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                     bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p class="text-sm text-neutral-600 mt-1">{{ labelRango() }}</p>
        </div>
        <div class="flex items-center gap-2">
          @for (r of rangos; track r.val) {
            <button (click)="setRango(r.val)"
              class="px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all duration-200"
              [class]="rango() === r.val
                ? 'bg-indigo-500/[0.14] border-indigo-400/40 text-indigo-300'
                : 'bg-white/[0.03] border-white/[0.07] text-neutral-500 hover:text-neutral-200 hover:border-white/[0.1]'">
              {{ r.label }}
            </button>
          }
          <button (click)="cargarMetricas()" [disabled]="cargando()"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
                   bg-white/[0.04] border border-white/[0.07] text-neutral-400
                   hover:text-white hover:border-white/[0.1] transition-all duration-200
                   disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-3.5 h-3.5" [class.animate-spin]="cargando()"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refrescar
          </button>
        </div>
      </div>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-[130px] rounded-2xl border border-white/[0.04] bg-[#0f1424]/40 p-5">
              <div class="skeleton h-2.5 w-16 mb-5 rounded-md"></div>
              <div class="skeleton h-7 w-28 mb-3 rounded-md"></div>
              <div class="skeleton h-2 w-20 rounded-md"></div>
            </div>
          }
        </div>
        <div class="grid grid-cols-3 gap-5">
          <div class="col-span-2 rounded-2xl border border-white/[0.04] bg-[#0f1424]/40 h-64"></div>
          <div class="rounded-2xl border border-white/[0.04] bg-[#0f1424]/40 h-64"></div>
        </div>
      }

      @if (!cargando() && metricas()) {

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-emerald-500/20 transition-all duration-300 group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(16,185,129,0.05) 0%,transparent 60%)"></div>
            <div class="flex items-start justify-between mb-2">
              <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Ventas</p>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20
                          flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <svg class="w-full h-8 mb-2" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline [attr.points]="sparklinePoints(metricas()!.tendenciaVentas)"
                fill="none" stroke="rgba(16,185,129,0.5)" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
              <polyline [attr.points]="sparklineFill(metricas()!.tendenciaVentas)"
                fill="rgba(16,185,129,0.06)" stroke="none"/>
            </svg>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {{ metricas()!.totalVentas | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] font-semibold"
               [class]="metricas()!.crecimientoVentas >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ metricas()!.crecimientoVentas >= 0 ? '+' : '' }}{{ metricas()!.crecimientoVentas }}% vs período ant.
            </p>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-blue-500/20 transition-all duration-300 group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(59,130,246,0.05) 0%,transparent 60%)"></div>
            <div class="flex items-start justify-between mb-4">
              <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Inversión</p>
              <div class="w-7 h-7 rounded-lg bg-blue-500/[0.08] border border-blue-500/20
                          flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {{ metricas()!.inversionStock | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-blue-500/70 font-medium">Costo × stock actual</p>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-xl p-5
                      hover:border-violet-500/20 transition-all duration-300 group">
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background:radial-gradient(ellipse at 0% 0%,rgba(139,92,246,0.05) 0%,transparent 60%)"></div>
            <div class="flex items-start justify-between mb-4">
              <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Potencial</p>
              <div class="w-7 h-7 rounded-lg bg-violet-500/[0.08] border border-violet-500/20
                          flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <p class="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {{ metricas()!.gananciaProyectada | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-violet-500/70 font-medium">Margen en góndola</p>
          </div>

          <div class="relative overflow-hidden rounded-2xl border transition-all duration-300
                      bg-[#0f1424]/40 backdrop-blur-xl p-5"
               [class]="metricas()!.productosCriticosCount > 0
                 ? 'border-red-500/25 hover:border-red-400/40'
                 : 'border-white/[0.06] hover:border-white/[0.09]'">
            @if (metricas()!.productosCriticosCount > 0) {
              <div class="absolute inset-0 animate-pulse"
                   style="background:radial-gradient(ellipse at 80% 20%,rgba(239,68,68,0.07) 0%,transparent 55%)"></div>
              <div class="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-30"
                   style="background:rgba(239,68,68,0.25)"></div>
            }
            <div class="flex items-start justify-between mb-4 relative">
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em]"
                 [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-500/80' : 'text-neutral-500'">
                Alertas
              </p>
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
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
            <p class="text-2xl font-black tabular-nums leading-none mb-1 relative"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-300' : 'text-white'">
              {{ metricas()!.productosCriticosCount }}
            </p>
            <p class="text-[11px] font-medium relative"
               [class]="metricas()!.productosCriticosCount > 0 ? 'text-red-500/70' : 'text-neutral-600'">
              {{ metricas()!.productosCriticosCount > 0 ? 'Bajo stock mínimo' : 'Sin alertas' }}
            </p>
          </div>

        </div>

        <div class="grid grid-cols-3 gap-5">

          <div class="col-span-2 rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 class="text-[13px] font-bold text-white">Ranking de Productos</h3>
                <p class="text-[11px] text-neutral-600 mt-0.5">Por recaudación · {{ labelRango() }}</p>
              </div>
              <a routerLink="/ventas/historial"
                 class="text-[11px] text-indigo-400/70 hover:text-indigo-300 transition-colors">
                Ver historial →
              </a>
            </div>

            @if (metricas()!.productosMasVendidos.length === 0) {
              <div class="flex flex-col items-center justify-center py-14">
                <p class="text-[13px] text-neutral-600">Sin ventas en el período seleccionado</p>
              </div>
            } @else {
              <div class="p-5 space-y-4">
                @for (p of metricas()!.productosMasVendidos; track p.nombre; let idx = $index) {
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold
                                bg-gradient-to-br border"
                         [class]="rankBg(idx)">
                      {{ idx + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1.5">
                        <p class="text-[13px] font-medium text-neutral-200 truncate">{{ p.nombre }}</p>
                        <span class="text-[11px] text-neutral-500 tabular-nums ml-2 shrink-0">{{ p.cantidadVendida }} u.</span>
                      </div>
                      <div class="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                             [class]="rankBar(idx)"
                             [style.width]="rankPct(idx) + '%'"></div>
                      </div>
                    </div>
                    <span class="text-[13px] font-bold text-neutral-200 tabular-nums shrink-0 w-28 text-right">
                      {{ p.recaudacion | currency:'ARS':'symbol':'1.0-0' }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden flex flex-col">
            <div class="px-5 py-4 border-b border-white/[0.05]">
              <h3 class="text-[13px] font-bold text-white">Actividad Reciente</h3>
              <p class="text-[11px] text-neutral-600 mt-0.5">Eventos del local</p>
            </div>

            <div class="flex-1 p-4 overflow-y-auto">
              @if (metricas()!.actividadReciente.length === 0) {
                <div class="flex flex-col items-center justify-center h-full py-8">
                  <p class="text-[12px] text-neutral-600">Sin actividad registrada</p>
                </div>
              } @else {
                <div class="relative">
                  <div class="absolute left-[5px] top-0 bottom-0 w-px bg-white/[0.05]"></div>
                  <div class="space-y-4">
                    @for (e of metricas()!.actividadReciente; track $index) {
                      <div class="flex gap-3">
                        <div class="w-3 h-3 rounded-full shrink-0 mt-0.5 border-2 z-10"
                             [class]="e.tipo === 'alerta'
                               ? 'bg-red-900/80 border-red-500/60'
                               : 'bg-indigo-900/80 border-indigo-500/60'"></div>
                        <div class="flex-1 min-w-0">
                          <p class="text-[12px] text-neutral-300 leading-snug">{{ e.descripcion }}</p>
                          <p class="text-[10px] text-neutral-600 mt-0.5">{{ e.fecha | date:'HH:mm' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="px-4 py-3.5 border-t border-white/[0.05] grid grid-cols-3 gap-2">
              @for (a of quickActions; track a.route) {
                <a [routerLink]="a.route"
                  class="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl
                         border border-white/[0.05] bg-white/[0.02]
                         hover:bg-white/[0.04] hover:border-white/[0.08]
                         transition-all duration-200 cursor-pointer">
                  <svg class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                       [class]="a.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="a.iconPath"/>
                  </svg>
                  <p class="text-[10px] font-medium text-neutral-500 group-hover:text-neutral-300
                            transition-colors text-center leading-tight">{{ a.label }}</p>
                </a>
              }
            </div>
          </div>

        </div>
      }

    </div>
  `
})
export class DashboardComponent implements OnInit {
  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly API = 'http://localhost:5075/api/dashboard/metricas';

  metricas = signal<MetricasDashboard | null>(null);
  cargando = signal(true);
  rango    = signal<Rango>(1);

  readonly rangos = [
    { val: 1  as Rango, label: 'Hoy' },
    { val: 7  as Rango, label: '7 días' },
    { val: 30 as Rango, label: 'Mes' }
  ];

  readonly quickActions = [
    { route:'/ventas',        label:'Nueva venta', iconColor:'text-indigo-400',  iconPath:'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { route:'/productos',     label:'Inventario',  iconColor:'text-blue-400',   iconPath:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { route:'/finanzas/caja', label:'Caja',        iconColor:'text-emerald-400', iconPath:'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }
  ];

  labelRango(): string {
    return ({ 1:'Hoy', 7:'Últimos 7 días', 30:'Este mes' } as Record<number,string>)[this.rango()];
  }

  ngOnInit(): void { this.cargarMetricas(); }

  setRango(r: Rango): void { this.rango.set(r); this.cargarMetricas(); }

  cargarMetricas(): void {
    this.cargando.set(true);
    this.http.get<MetricasDashboard>(`${this.API}?rangoDias=${this.rango()}`).subscribe({
      next:  data => { this.metricas.set(data); this.cargando.set(false); },
      error: ()   => { this.toast.error('No se pudieron cargar las métricas.'); this.cargando.set(false); }
    });
  }

  sparklinePoints(vals: number[]): string {
    if (!vals?.length) return '';
    const max = Math.max(...vals, 1);
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * 100;
      const y = 28 - (v / max) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  sparklineFill(vals: number[]): string {
    if (!vals?.length) return '';
    return `${this.sparklinePoints(vals)} 100,28 0,28`;
  }

  rankBg(idx: number): string {
    return [
      'from-amber-500/[0.15] to-amber-700/[0.1] border-amber-500/25 text-amber-300',
      'from-neutral-400/[0.1] to-neutral-700/[0.08] border-neutral-500/20 text-neutral-400',
      'from-orange-600/[0.1] to-orange-900/[0.08] border-orange-600/20 text-orange-500',
      'from-white/[0.04] to-white/[0.02] border-white/[0.07] text-neutral-500',
      'from-white/[0.04] to-white/[0.02] border-white/[0.07] text-neutral-500',
    ][idx] ?? 'from-white/[0.04] to-white/[0.02] border-white/[0.07] text-neutral-500';
  }

  rankBar(idx: number): string {
    return [
      'bg-gradient-to-r from-amber-500 to-amber-400',
      'bg-gradient-to-r from-neutral-400 to-neutral-300',
      'bg-gradient-to-r from-orange-600 to-orange-400',
      'bg-gradient-to-r from-neutral-600 to-neutral-500',
      'bg-gradient-to-r from-neutral-700 to-neutral-600',
    ][idx] ?? 'bg-neutral-700';
  }

  rankPct(idx: number): number {
    const top = this.metricas()?.productosMasVendidos ?? [];
    if (!top.length) return 0;
    const max = top[0].recaudacion;
    return max > 0 ? Math.round((top[idx]?.recaudacion / max) * 100) : 0;
  }
}
