import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { VentasService } from '../../core/services/ventas.service';
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

interface ItemCarrito {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
}

interface UltimaVenta {
  fecha: Date;
  items: ItemCarrito[];
  total: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="flex h-full overflow-hidden">

      <div class="flex flex-col flex-1 overflow-hidden p-6 lg:p-8 gap-6">

        <div>
          <h1 class="text-2xl font-bold tracking-tight
                     bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                     bg-clip-text text-transparent">
            Punto de Venta
          </h1>
          <p class="text-sm text-neutral-600 mt-1">Seleccioná productos para agregar al carrito</p>
        </div>

        <div class="relative">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="text" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"
            placeholder="Buscar producto…"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-neutral-300
                   bg-white/[0.04] border border-white/[0.07] placeholder-neutral-600
                   outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30
                   transition-all duration-200"/>
        </div>

        <div class="flex-1 overflow-y-auto rounded-2xl border border-white/[0.06]
                    bg-[#0f1424]/40 backdrop-blur-xl">
          @if (cargando()) {
            <div class="flex items-center justify-center h-full">
              <svg class="animate-spin h-5 w-5 text-indigo-400/60" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else if (productosFiltrados().length === 0) {
            <div class="flex flex-col items-center justify-center h-full py-12">
              <p class="text-[13px] text-neutral-600">Sin resultados</p>
            </div>
          } @else {
            <div class="p-3 space-y-0.5">
              @for (p of productosFiltrados(); track p.id) {
                <button (click)="agregarAlCarrito(p)"
                  [disabled]="p.stockActual === 0"
                  class="group w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left
                         border-l-2 border-transparent
                         hover:bg-white/[0.02] hover:border-l-indigo-500
                         transition-all duration-200 ease-out
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                         disabled:hover:border-transparent">
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                      {{ p.nombre }}
                    </p>
                    @if (p.codigoBarras) {
                      <p class="text-[11px] text-neutral-600 font-mono mt-0.5">{{ p.codigoBarras }}</p>
                    }
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[13px] font-bold text-indigo-300 tabular-nums">
                      {{ p.precioVenta | currency:'ARS':'symbol':'1.0-0' }}
                    </span>
                    <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          [class]="p.stockActual <= p.stockMinimo
                            ? 'bg-red-500/[0.08] text-red-400 border-red-500/20'
                            : 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20'">
                      {{ p.stockActual }}
                    </span>
                  </div>
                </button>
              }
            </div>
          }
        </div>

      </div>

      <div class="w-[300px] xl:w-[340px] shrink-0 flex flex-col border-l border-white/[0.06]
                  bg-[#0b0f1c]/60 backdrop-blur-xl">

        <div class="px-5 py-4 border-b border-white/[0.06]">
          <h2 class="text-sm font-bold text-white">Ticket</h2>
          @if (carrito().length > 0) {
            <p class="text-[11px] text-neutral-600 mt-0.5">{{ carrito().length }} producto{{ carrito().length > 1 ? 's' : '' }}</p>
          }
        </div>

        <div class="flex-1 overflow-y-auto py-3 px-3">
          @if (carrito().length === 0) {
            <div class="flex flex-col items-center justify-center h-full gap-3 py-12">
              <div class="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg class="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <p class="text-[12px] text-neutral-600">Carrito vacío</p>
            </div>
          } @else {
            <div class="space-y-1">
              @for (item of carrito(); track item.productoId; let idx = $index) {
                <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#121829]/40
                            border border-white/[0.04]">
                  <div class="flex-1 min-w-0">
                    <p class="text-[12px] font-medium text-neutral-300 truncate">{{ item.nombre }}</p>
                    <p class="text-[11px] text-indigo-400/70 tabular-nums mt-0.5">
                      {{ item.precioUnitario | currency:'ARS':'symbol':'1.0-0' }} × {{ item.cantidad }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button (click)="actualizarCantidad(idx, item.cantidad - 1)"
                      class="w-5 h-5 flex items-center justify-center rounded-md text-neutral-500
                             hover:text-white hover:bg-white/[0.06] transition-all duration-150 text-xs font-bold">
                      −
                    </button>
                    <span class="w-5 text-center text-[12px] font-semibold text-neutral-300 tabular-nums">
                      {{ item.cantidad }}
                    </span>
                    <button (click)="actualizarCantidad(idx, item.cantidad + 1)"
                      [disabled]="item.cantidad >= item.stockDisponible"
                      class="w-5 h-5 flex items-center justify-center rounded-md text-neutral-500
                             hover:text-white hover:bg-white/[0.06] transition-all duration-150 text-xs font-bold
                             disabled:opacity-30 disabled:cursor-not-allowed">
                      +
                    </button>
                    <button (click)="eliminarDelCarrito(idx)"
                      class="w-5 h-5 flex items-center justify-center rounded-md text-neutral-700
                             hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150 ml-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (carrito().length > 0) {
          <div class="px-5 py-4 border-t border-white/[0.06] space-y-4">
            <div class="flex items-baseline justify-between">
              <span class="text-[11px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Total</span>
              <span class="text-2xl font-black text-white tabular-nums">
                {{ totalVenta() | currency:'ARS':'symbol':'1.0-0' }}
              </span>
            </div>

            @if (errorVenta()) {
              <p class="text-[12px] text-red-400 px-3 py-2 rounded-xl bg-red-500/[0.07] border border-red-500/20">
                {{ errorVenta() }}
              </p>
            }

            <button (click)="confirmarVenta()" [disabled]="confirmando()"
              class="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl
                     text-[13px] font-bold text-white
                     bg-gradient-to-b from-emerald-500 to-emerald-700
                     border border-emerald-400/30
                     shadow-[0_0_20px_rgba(16,185,129,0.18)]
                     hover:from-emerald-400 hover:to-emerald-600
                     active:scale-[0.97] transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
              @if (confirmando()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              } @else {
                <span>💳</span>
              }
              {{ confirmando() ? 'Procesando…' : 'Confirmar Venta' }}
            </button>
          </div>
        }

      </div>
    </div>

    @if (ultimaVenta()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="cerrarTicket()"></div>

        <div class="relative w-full max-w-sm rounded-3xl overflow-hidden
                    bg-[#0c1120] border border-white/[0.07] shadow-2xl"
             style="animation:fadeInScale .2s ease-out">

          <div class="px-6 py-5 border-b border-white/[0.06]">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/[0.1] border border-emerald-500/20
                          flex items-center justify-center">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p class="text-[14px] font-bold text-white">Venta registrada</p>
                <p class="text-[11px] text-neutral-600">
                  {{ ultimaVenta()!.fecha | date:'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>
          </div>

          <div id="thermal-ticket" class="px-6 py-4">
            <div class="space-y-1 mb-4">
              @for (item of ultimaVenta()!.items; track item.productoId) {
                <div class="flex items-center gap-2">
                  <span class="flex-1 text-[12px] text-neutral-400 truncate">{{ item.nombre }}</span>
                  <span class="text-[11px] text-neutral-600 tabular-nums w-12 text-center">
                    ×{{ item.cantidad }}
                  </span>
                  <span class="text-[12px] font-semibold text-neutral-300 tabular-nums w-24 text-right">
                    {{ item.cantidad * item.precioUnitario | currency:'ARS':'symbol':'1.0-0' }}
                  </span>
                </div>
              }
            </div>

            <div class="flex items-baseline justify-between pt-3 border-t border-white/[0.06] mb-1">
              <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Total</span>
              <span class="text-xl font-black text-white tabular-nums">
                {{ ultimaVenta()!.total | currency:'ARS':'symbol':'1.0-0' }}
              </span>
            </div>
            <p class="text-center text-[10px] text-neutral-700 mt-3">Gracias por su compra</p>
          </div>

          <div class="px-6 py-4 border-t border-white/[0.06] flex gap-2.5">
            <button (click)="imprimirTicket()"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     text-[13px] font-semibold text-neutral-200
                     bg-gradient-to-b from-neutral-800 to-neutral-950
                     border border-neutral-700/50
                     hover:from-neutral-700 hover:to-neutral-900
                     transition-all duration-200">
              🖨️ Imprimir
            </button>
            <button (click)="cerrarTicket()"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     text-[13px] font-bold text-white
                     bg-gradient-to-b from-indigo-500 to-indigo-700
                     border border-indigo-400/30
                     shadow-[0_0_16px_rgba(99,102,241,0.2)]
                     hover:from-indigo-400 hover:to-indigo-600
                     transition-all duration-200">
              Nueva venta
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeInScale {
      from { opacity:0; transform:scale(0.96) translateY(6px); }
      to   { opacity:1; transform:scale(1)    translateY(0);   }
    }
  `]
})
export class VentasComponent implements OnInit {
  private http         = inject(HttpClient);
  private ventasService = inject(VentasService);
  readonly auth        = inject(AuthService);

  private readonly API = 'http://localhost:5075/api/productos';

  productos    = signal<Producto[]>([]);
  cargando     = signal(true);
  confirmando  = signal(false);
  errorVenta   = signal('');
  ultimaVenta  = signal<UltimaVenta | null>(null);
  busqueda     = signal('');

  carrito = signal<ItemCarrito[]>([]);

  productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.productos();
    return this.productos().filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigoBarras ?? '').toLowerCase().includes(q)
    );
  });

  totalVenta = computed(() =>
    this.carrito().reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
  );

  ngOnInit(): void {
    this.http.get<Producto[]>(this.API).subscribe({
      next:  data => { this.productos.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false)
    });
  }

  agregarAlCarrito(p: Producto): void {
    if (p.stockActual === 0) return;
    const current = this.carrito();
    const idx = current.findIndex(i => i.productoId === p.id);
    if (idx >= 0) {
      if (current[idx].cantidad >= current[idx].stockDisponible) return;
      const updated = [...current];
      updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
      this.carrito.set(updated);
    } else {
      this.carrito.set([...current, {
        productoId:      p.id,
        nombre:          p.nombre,
        precioUnitario:  p.precioVenta,
        cantidad:        1,
        stockDisponible: p.stockActual
      }]);
    }
  }

  actualizarCantidad(index: number, nuevaCantidad: number): void {
    if (nuevaCantidad <= 0) { this.eliminarDelCarrito(index); return; }
    const current = this.carrito();
    if (nuevaCantidad > current[index].stockDisponible) return;
    const updated = [...current];
    updated[index] = { ...updated[index], cantidad: nuevaCantidad };
    this.carrito.set(updated);
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.set(this.carrito().filter((_, i) => i !== index));
  }

  confirmarVenta(): void {
    if (this.carrito().length === 0 || this.confirmando()) return;
    this.confirmando.set(true);
    this.errorVenta.set('');

    const items = this.carrito().map(i => ({ productoId: i.productoId, cantidad: i.cantidad }));

    this.ventasService.registrarVenta(items).subscribe({
      next: () => {
        const venta: UltimaVenta = {
          fecha: new Date(),
          items: [...this.carrito()],
          total: this.totalVenta()
        };
        this.productos.set(
          this.productos().map(p => {
            const item = this.carrito().find(i => i.productoId === p.id);
            return item ? { ...p, stockActual: p.stockActual - item.cantidad } : p;
          })
        );
        this.carrito.set([]);
        this.confirmando.set(false);
        this.ultimaVenta.set(venta);
      },
      error: err => {
        this.errorVenta.set(err?.error?.message ?? err?.error?.detail ?? 'Error al registrar la venta.');
        this.confirmando.set(false);
      }
    });
  }

  imprimirTicket(): void { window.print(); }

  cerrarTicket(): void { this.ultimaVenta.set(null); }
}
