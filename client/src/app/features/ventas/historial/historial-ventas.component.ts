import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VentaResumen {
  id: string;
  fecha: string;
  total: number;
  cantidadItems: number;
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="p-8 max-w-5xl mx-auto">

      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight
                   bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                   bg-clip-text text-transparent">
          Historial de ventas
        </h1>
        <p class="text-sm text-neutral-600 mt-1.5">
          {{ ventas().length }} venta{{ ventas().length !== 1 ? 's' : '' }} registrada{{ ventas().length !== 1 ? 's' : '' }}
        </p>
      </div>

      @if (errorMsg()) {
        <div class="px-4 py-3 rounded-xl bg-red-500/[0.07] border border-red-500/20 mb-5 flex items-center justify-between">
          <p class="text-[13px] text-red-400">{{ errorMsg() }}</p>
          <button (click)="cargarHistorial()"
            class="text-[12px] text-red-400/70 hover:text-red-300 transition-colors underline">
            Reintentar
          </button>
        </div>
      }

      <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden">

        @if (cargando()) {
          <div class="flex items-center justify-center py-24">
            <svg class="animate-spin h-6 w-6 text-indigo-400/60" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else if (ventas().length === 0) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p class="text-[13px] font-medium text-neutral-600">Sin ventas registradas</p>
          </div>
        } @else {
          <div class="px-3 py-2">

            <div class="flex items-center gap-4 px-4 py-2 mb-1">
              <span class="flex-1 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Fecha</span>
              <span class="w-48 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">ID</span>
              <span class="w-20 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Items</span>
              <span class="w-36 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Total</span>
            </div>

            <div class="space-y-0.5">
              @for (v of ventas(); track v.id) {
                <div class="group flex items-center gap-4 px-4 py-3.5 rounded-xl
                            border-l-2 border-transparent
                            hover:bg-white/[0.02] hover:border-l-indigo-500
                            transition-all duration-300 ease-out cursor-default">
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-medium text-neutral-200">
                      {{ v.fecha | date:'dd/MM/yyyy' }}
                    </p>
                    <p class="text-[11px] text-neutral-600 mt-0.5">
                      {{ v.fecha | date:'HH:mm:ss' }}
                    </p>
                  </div>
                  <span class="w-48 shrink-0 text-right text-[11px] text-neutral-600 font-mono truncate">
                    {{ v.id }}
                  </span>
                  <span class="w-20 shrink-0 text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                                 bg-indigo-500/[0.1] text-indigo-400 border border-indigo-500/20">
                      {{ v.cantidadItems }}
                    </span>
                  </span>
                  <span class="w-36 shrink-0 text-right text-[14px] font-bold text-neutral-200 tabular-nums">
                    {{ v.total | currency:'ARS':'symbol':'1.0-0' }}
                  </span>
                </div>
              }
            </div>

          </div>
        }

      </div>

      @if (ventas().length > 0) {
        <div class="flex justify-end mt-4">
          <div class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.06]
                      bg-[#0f1424]/40 backdrop-blur-sm">
            <span class="text-[11px] text-neutral-600 uppercase tracking-[0.1em]">Total acumulado</span>
            <span class="text-[14px] font-bold text-emerald-400 tabular-nums ml-2">
              {{ totalAcumulado() | currency:'ARS':'symbol':'1.0-0' }}
            </span>
          </div>
        </div>
      }

    </div>
  `
})
export class HistorialVentasComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:5075/api/ventas';

  ventas   = signal<VentaResumen[]>([]);
  cargando = signal(true);
  errorMsg = signal('');

  totalAcumulado = () => this.ventas().reduce((sum, v) => sum + v.total, 0);

  ngOnInit(): void { this.cargarHistorial(); }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.http.get<VentaResumen[]>(this.API).subscribe({
      next:  data => { this.ventas.set(data); this.cargando.set(false); },
      error: ()   => { this.errorMsg.set('No se pudo cargar el historial.'); this.cargando.set(false); }
    });
  }
}
