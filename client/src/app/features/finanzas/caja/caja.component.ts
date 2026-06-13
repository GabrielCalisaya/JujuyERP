import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface MovimientoCaja {
  fecha: string;
  tipo: string;
  metodoPago: string;
  monto: number;
  concepto: string;
}

interface ResumenCaja {
  totalHoy: number;
  saldoEfectivo: number;
  saldoDebito: number;
  saldoCredito: number;
  saldoTransferencia: number;
  movimientos: MovimientoCaja[];
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="p-8 max-w-5xl mx-auto space-y-8">

      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight
                     bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                     bg-clip-text text-transparent">
            Caja Chica
          </h1>
          <p class="text-sm text-neutral-600 mt-1.5">Panel financiero de la jornada</p>
        </div>
        <button (click)="cargarResumen()" [disabled]="cargando()"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
                 bg-white/[0.04] border border-white/[0.07] text-neutral-400
                 hover:text-white hover:border-white/[0.1] transition-all duration-200
                 disabled:opacity-40">
          <svg class="w-3.5 h-3.5" [class.animate-spin]="cargando()"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refrescar
        </button>
      </div>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-[100px] rounded-2xl border border-white/[0.04] bg-[#0f1424]/40 p-5">
              <div class="skeleton h-2.5 w-20 mb-4 rounded-md"></div>
              <div class="skeleton h-6 w-28 rounded-md"></div>
            </div>
          }
        </div>
      } @else if (resumen()) {

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <div class="col-span-full xl:col-span-1 rounded-2xl border border-emerald-500/20
                      bg-gradient-to-br from-emerald-500/[0.07] to-transparent
                      backdrop-blur-xl p-5">
            <p class="text-[10px] font-semibold text-emerald-500/70 uppercase tracking-[0.12em] mb-3">
              Total Hoy
            </p>
            <p class="text-3xl font-black text-white tabular-nums leading-none">
              {{ resumen()!.totalHoy | currency:'ARS':'symbol':'1.0-0' }}
            </p>
            <p class="text-[11px] text-emerald-500/60 mt-2 font-medium">
              {{ resumen()!.movimientos.length }} movimiento{{ resumen()!.movimientos.length !== 1 ? 's' : '' }}
            </p>
          </div>

          @for (m of medios; track m.key) {
            <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-base">{{ m.icon }}</span>
                <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">{{ m.label }}</p>
              </div>
              <p class="text-xl font-black text-white tabular-nums leading-none">
                {{ getSaldo(m.key) | currency:'ARS':'symbol':'1.0-0' }}
              </p>
            </div>
          }

        </div>

        <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-white/[0.05]">
            <h3 class="text-[13px] font-bold text-white">Movimientos de la jornada</h3>
          </div>

          @if (resumen()!.movimientos.length === 0) {
            <div class="flex flex-col items-center justify-center py-20">
              <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                          flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <p class="text-[13px] font-medium text-neutral-600">Sin movimientos hoy</p>
              <p class="text-[11px] text-neutral-700 mt-1">Las ventas aparecerán aquí al registrarse</p>
            </div>
          } @else {
            <div class="px-3 py-2">
              <div class="flex items-center gap-4 px-4 py-2 mb-1">
                <span class="w-20 shrink-0 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Hora</span>
                <span class="flex-1 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Concepto</span>
                <span class="w-28 shrink-0 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Método</span>
                <span class="w-20 shrink-0 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Tipo</span>
                <span class="w-32 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Monto</span>
              </div>

              <div class="space-y-0.5">
                @for (mov of resumen()!.movimientos; track $index) {
                  <div class="group flex items-center gap-4 px-4 py-3 rounded-xl border-l-2 border-transparent
                              hover:bg-white/[0.02] hover:border-l-indigo-500
                              transition-all duration-200 ease-out">
                    <span class="w-20 shrink-0 text-[12px] text-neutral-500 tabular-nums font-mono">
                      {{ mov.fecha | date:'HH:mm' }}
                    </span>
                    <span class="flex-1 text-[13px] text-neutral-300 truncate">{{ mov.concepto }}</span>
                    <span class="w-28 shrink-0">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                                   bg-white/[0.04] border border-white/[0.07] text-neutral-400">
                        {{ metodoIcon(mov.metodoPago) }} {{ mov.metodoPago }}
                      </span>
                    </span>
                    <span class="w-20 shrink-0">
                      <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                            [class]="mov.tipo === 'Ingreso'
                              ? 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/[0.1] text-red-400 border-red-500/20'">
                        {{ mov.tipo }}
                      </span>
                    </span>
                    <span class="w-32 shrink-0 text-right text-[13px] font-bold tabular-nums"
                          [class]="mov.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'">
                      {{ mov.tipo === 'Ingreso' ? '+' : '-' }}{{ mov.monto | currency:'ARS':'symbol':'1.0-0' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class CajaComponent implements OnInit {
  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly API = 'http://localhost:5075/api/finanzas/caja';

  resumen  = signal<ResumenCaja | null>(null);
  cargando = signal(true);

  readonly medios = [
    { key: 'Efectivo',      label: 'Efectivo',     icon: '💵' },
    { key: 'Debito',        label: 'Débito',        icon: '💳' },
    { key: 'Transferencia', label: 'Transferencia', icon: '📲' },
  ];

  getSaldo(key: string): number {
    const r = this.resumen();
    if (!r) return 0;
    return ({
      Efectivo:      r.saldoEfectivo,
      Debito:        r.saldoDebito,
      Credito:       r.saldoCredito,
      Transferencia: r.saldoTransferencia,
    } as Record<string,number>)[key] ?? 0;
  }

  metodoIcon(m: string): string {
    return ({ Efectivo:'💵', Debito:'💳', Credito:'🏦', Transferencia:'📲' } as Record<string,string>)[m] ?? '💰';
  }

  ngOnInit(): void { this.cargarResumen(); }

  cargarResumen(): void {
    this.cargando.set(true);
    this.http.get<ResumenCaja>(this.API).subscribe({
      next:  data => { this.resumen.set(data); this.cargando.set(false); },
      error: ()   => { this.toast.error('No se pudo cargar el resumen de caja.'); this.cargando.set(false); }
    });
  }
}
