import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

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

      <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden">

        @if (cargando()) {
          <div class="px-3 py-2">
            <div class="flex items-center gap-4 px-4 py-2 mb-1">
              <div class="skeleton h-2 flex-1 rounded-md"></div>
              <div class="skeleton h-2 w-48 rounded-md"></div>
              <div class="skeleton h-2 w-20 rounded-md"></div>
              <div class="skeleton h-2 w-36 rounded-md"></div>
            </div>
            <div class="space-y-1">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="flex items-center gap-4 px-4 py-3.5 rounded-xl">
                  <div class="flex-1 space-y-1.5">
                    <div class="skeleton h-3.5 w-20 rounded-md"></div>
                    <div class="skeleton h-2.5 w-12 rounded-md"></div>
                  </div>
                  <div class="skeleton h-2.5 w-48 rounded-md"></div>
                  <div class="skeleton h-5 w-10 rounded-full"></div>
                  <div class="skeleton h-4 w-28 rounded-md"></div>
                </div>
              }
            </div>
          </div>
        } @else if (ventas().length === 0) {
          <div class="flex flex-col items-center justify-center py-24">
            <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                        flex items-center justify-center mb-4">
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
                    <p class="text-[11px] text-neutral-600 mt-0.5">{{ v.fecha | date:'HH:mm:ss' }}</p>
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

      @if (!cargando() && ventas().length > 0) {
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
  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly API = 'http://localhost:5075/api/ventas';

  ventas   = signal<VentaResumen[]>([]);
  cargando = signal(true);

  totalAcumulado = () => this.ventas().reduce((sum, v) => sum + v.total, 0);

  ngOnInit(): void { this.cargarHistorial(); }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.http.get<VentaResumen[]>(this.API).subscribe({
      next:  data => { this.ventas.set(data); this.cargando.set(false); },
      error: ()   => {
        this.toast.error('No se pudo cargar el historial de ventas.');
        this.cargando.set(false);
      }
    });
  }
}
