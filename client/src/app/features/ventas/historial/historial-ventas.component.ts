import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VentaResumen {
  id: string;
  fecha: string;
  cantidadItems: number;
  total: number;
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="p-6 max-w-6xl mx-auto">

      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Historial de Ventas</h1>
          <p class="text-sm text-neutral-500 mt-1">Todas las transacciones registradas</p>
        </div>
        <button (click)="cargarHistorial()"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                 text-neutral-400 bg-neutral-800/60 border border-neutral-700/60
                 hover:text-neutral-200 hover:border-neutral-600
                 transition-all duration-200 ease-in-out">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>
      </div>

      <div class="bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800/50 overflow-hidden">

        @if (cargando()) {
          <div class="flex items-center justify-center py-24">
            <svg class="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else if (ventas().length === 0) {
          <div class="flex flex-col items-center justify-center py-24">
            <svg class="w-14 h-14 mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-sm font-medium text-neutral-500">Sin ventas registradas aún</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-800/70">
                  <th class="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Comprobante</th>
                  <th class="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Fecha y Hora</th>
                  <th class="text-right px-6 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Artículos</th>
                  <th class="text-right px-6 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-800/50">
                @for (venta of ventas(); track venta.id; let i = $index) {
                  <tr class="hover:bg-neutral-800/40 transition-all duration-300 ease-in-out">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20
                                    flex items-center justify-center shrink-0">
                          <span class="text-[10px] font-bold text-indigo-400">#{{ ventas().length - i }}</span>
                        </div>
                        <span class="font-mono text-xs text-neutral-500">
                          {{ venta.id.substring(0, 8).toUpperCase() }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-neutral-300">
                      {{ venta.fecha | date:'dd/MM/yyyy' }}
                      <span class="text-neutral-500 ml-1.5 text-xs">{{ venta.fecha | date:'HH:mm' }}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                   bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                        {{ venta.cantidadItems }} uds.
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-neutral-200 tabular-nums">
                      {{ venta.total | currency:'ARS':'symbol':'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="border-t border-neutral-700/60 bg-neutral-800/30">
                  <td colspan="2" class="px-6 py-4 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                    Total acumulado · {{ ventas().length }} venta{{ ventas().length !== 1 ? 's' : '' }}
                  </td>
                  <td class="px-6 py-4 text-right text-xs font-semibold text-neutral-500">
                    {{ totalUnidades() }} uds.
                  </td>
                  <td class="px-6 py-4 text-right font-black text-indigo-400 tabular-nums">
                    {{ totalAcumulado() | currency:'ARS':'symbol':'1.2-2' }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }

        @if (error()) {
          <div class="px-6 py-4 border-t border-red-500/20 bg-red-500/5">
            <p class="text-sm text-red-400">{{ error() }}</p>
          </div>
        }
      </div>

    </div>
  `
})
export class HistorialVentasComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:5075/api/ventas';

  ventas   = signal<VentaResumen[]>([]);
  cargando = signal(true);
  error    = signal('');

  totalAcumulado = () => this.ventas().reduce((s, v) => s + v.total, 0);
  totalUnidades  = () => this.ventas().reduce((s, v) => s + v.cantidadItems, 0);

  ngOnInit(): void { this.cargarHistorial(); }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.error.set('');
    this.http.get<VentaResumen[]>(this.API).subscribe({
      next:  data => { this.ventas.set(data); this.cargando.set(false); },
      error: ()   => { this.error.set('No se pudo cargar el historial.'); this.cargando.set(false); }
    });
  }
}
