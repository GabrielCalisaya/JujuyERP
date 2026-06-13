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
  nombreComercio: string;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-slate-100">

      <div class="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-5
                  grid grid-cols-3 gap-5 min-h-0 overflow-hidden">

        <div class="col-span-2 flex flex-col gap-4 min-h-0">

          <div class="flex items-center justify-between">
            <h1 class="text-lg font-bold text-slate-800">Punto de Venta</h1>
          </div>

          <div class="relative">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" [(ngModel)]="busqueda" placeholder="Buscar producto por nombre o código..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
                     text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400
                     focus:ring-4 focus:ring-indigo-50 transition-all"/>
          </div>

          @if (cargandoProductos()) {
            <div class="flex items-center justify-center py-16 flex-1">
              <svg class="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else {
            <div class="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
              @if (productosFiltrados().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                  <svg class="w-10 h-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-sm font-medium text-slate-500">Sin resultados</p>
                </div>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (p of productosFiltrados(); track p.id) {
                    <li (click)="agregarAlCarrito(p)"
                      class="flex items-center justify-between px-4 py-3 cursor-pointer
                             hover:bg-indigo-50 active:bg-indigo-100 transition-colors select-none group"
                      [class.opacity-40]="p.stockActual <= 0"
                      [class.pointer-events-none]="p.stockActual <= 0">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-slate-800 text-sm truncate">{{ p.nombre }}</span>
                          @if (p.stockActual <= p.stockMinimo && p.stockActual > 0) {
                            <span class="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Bajo</span>
                          }
                          @if (p.stockActual <= 0) {
                            <span class="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Sin stock</span>
                          }
                        </div>
                        <div class="flex items-center gap-3 mt-0.5">
                          @if (p.codigoBarras) {
                            <span class="text-xs text-slate-400 font-mono">{{ p.codigoBarras }}</span>
                          }
                          <span class="text-xs text-slate-400">Stock: {{ p.stockActual }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 ml-4 shrink-0">
                        <span class="font-bold text-indigo-600 text-sm">
                          {{ p.precioVenta | currency:'ARS':'symbol':'1.2-2' }}
                        </span>
                        <div class="w-7 h-7 rounded-lg bg-indigo-100 group-hover:bg-indigo-600
                                    flex items-center justify-center transition-colors shrink-0">
                          <svg class="w-3.5 h-3.5 text-indigo-600 group-hover:text-white transition-colors"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <div class="col-span-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 class="font-bold text-slate-800 text-sm">Ticket</h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ carrito().length }} ítem{{ carrito().length !== 1 ? 's' : '' }}</p>
            </div>
            @if (carrito().length > 0) {
              <button (click)="limpiarCarrito()"
                class="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                Limpiar
              </button>
            }
          </div>

          <div class="flex-1 overflow-y-auto px-4 py-3">
            @if (carrito().length === 0) {
              <div class="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <p class="text-sm font-medium text-slate-400">Seleccioná productos</p>
              </div>
            } @else {
              <ul class="space-y-2">
                @for (item of carrito(); track item.productoId; let i = $index) {
                  <li class="bg-slate-50 rounded-xl p-3">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <span class="text-sm font-medium text-slate-700 leading-tight flex-1 min-w-0 truncate">
                        {{ item.nombre }}
                      </span>
                      <button (click)="eliminarDelCarrito(i)"
                        class="w-5 h-5 rounded-full flex items-center justify-center shrink-0
                               text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5">
                        <button (click)="actualizarCantidad(i, item.cantidad - 1)"
                          class="w-6 h-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center
                                 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
                          </svg>
                        </button>
                        <span class="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">{{ item.cantidad }}</span>
                        <button (click)="actualizarCantidad(i, item.cantidad + 1)"
                          [disabled]="item.cantidad >= item.stockDisponible"
                          class="w-6 h-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center
                                 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                          </svg>
                        </button>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-slate-400 tabular-nums">{{ item.precioUnitario | currency:'ARS':'symbol':'1.2-2' }} c/u</div>
                        <div class="text-sm font-bold text-slate-800 tabular-nums">
                          {{ item.precioUnitario * item.cantidad | currency:'ARS':'symbol':'1.2-2' }}
                        </div>
                      </div>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="border-t border-slate-100 px-5 py-4 shrink-0 space-y-4">
            <div class="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
              <span class="text-base font-bold text-slate-800">TOTAL</span>
              <span class="text-2xl font-black text-indigo-700 tabular-nums">
                {{ totalVenta() | currency:'ARS':'symbol':'1.0-0' }}
              </span>
            </div>

            @if (errorVenta()) {
              <div class="px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <p class="text-xs text-red-600">{{ errorVenta() }}</p>
              </div>
            }

            <button (click)="confirmarVenta()"
              [disabled]="carrito().length === 0 || confirmando()"
              class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold
                     bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white
                     shadow-lg shadow-emerald-200 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100">
              @if (confirmando()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Procesando...
              } @else {
                <span>💳</span><span>Confirmar y Facturar Venta</span>
              }
            </button>
          </div>

        </div>
      </div>
    </div>

    @if (ultimaVenta()) {
      <div class="fixed inset-0 z-50 bg-slate-900/85 flex items-center justify-center p-6 gap-8">

        <div class="bg-white rounded-3xl shadow-2xl p-8 w-72 font-mono text-xs text-slate-800
                    flex flex-col gap-1">
          <p class="text-center font-black text-base tracking-tight">{{ ultimaVenta()!.nombreComercio }}</p>
          <p class="text-center text-slate-400">─────────────────────</p>
          <p class="text-center text-slate-500 text-[10px]">
            {{ ultimaVenta()!.fecha | date:'dd/MM/yyyy HH:mm:ss' }}
          </p>
          <p class="text-center text-slate-400 mt-1">─────────────────────</p>
          @for (item of ultimaVenta()!.items; track item.productoId) {
            <div class="flex justify-between gap-2 mt-1">
              <span class="flex-1 truncate">{{ item.cantidad }}x {{ item.nombre }}</span>
              <span class="tabular-nums shrink-0">
                {{ item.precioUnitario * item.cantidad | currency:'ARS':'symbol':'1.0-0' }}
              </span>
            </div>
          }
          <p class="text-slate-400 mt-2">─────────────────────</p>
          <div class="flex justify-between font-black text-base mt-1">
            <span>TOTAL</span>
            <span class="tabular-nums">{{ ultimaVenta()!.total | currency:'ARS':'symbol':'1.0-0' }}</span>
          </div>
          <p class="text-slate-400 mt-2">─────────────────────</p>
          <p class="text-center text-slate-500 text-[10px] mt-1">¡Gracias por su compra!</p>
          <p class="text-center text-slate-400 text-[10px]">JujuyERP · Sistema de Gestión</p>
        </div>

        <div class="flex flex-col gap-3 items-start">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-white font-bold text-lg">Venta registrada</p>
          </div>
          <p class="text-slate-400 text-sm">
            {{ ultimaVenta()!.total | currency:'ARS':'symbol':'1.0-0' }}
          </p>

          <button (click)="imprimirTicket()"
            class="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm
                   bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow-lg mt-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Imprimir Ticket
          </button>

          <button (click)="nuevaVenta()"
            class="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm
                   bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Venta
          </button>
        </div>

      </div>

      <div id="thermal-ticket" style="display:none">
        <div style="text-align:center; font-weight:900; font-size:11pt; margin-bottom:4px">
          {{ ultimaVenta()!.nombreComercio }}
        </div>
        <div style="text-align:center; color:#666; font-size:8pt; margin-bottom:8px">
          {{ ultimaVenta()!.fecha | date:'dd/MM/yyyy HH:mm:ss' }}
        </div>
        <div style="border-top:1px dashed #999; margin-bottom:6px"></div>
        @for (item of ultimaVenta()!.items; track item.productoId) {
          <div style="display:flex; justify-content:space-between; margin-bottom:3px">
            <span>{{ item.cantidad }}x {{ item.nombre }}</span>
            <span>{{ item.precioUnitario * item.cantidad | currency:'ARS':'symbol':'1.0-0' }}</span>
          </div>
        }
        <div style="border-top:1px dashed #999; margin-top:6px; margin-bottom:6px"></div>
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:11pt">
          <span>TOTAL</span>
          <span>{{ ultimaVenta()!.total | currency:'ARS':'symbol':'1.0-0' }}</span>
        </div>
        <div style="border-top:1px dashed #999; margin-top:6px; margin-bottom:6px"></div>
        <div style="text-align:center; color:#666; font-size:8pt">¡Gracias por su compra!</div>
        <div style="text-align:center; color:#999; font-size:7pt; margin-top:3px">JujuyERP · Sistema de Gestión</div>
      </div>
    }
  `
})
export class VentasComponent implements OnInit {
  private http          = inject(HttpClient);
  private ventasService = inject(VentasService);
  readonly auth         = inject(AuthService);

  private readonly API_PRODUCTOS = 'http://localhost:5075/api/productos';

  productos          = signal<Producto[]>([]);
  cargandoProductos  = signal(true);
  carrito            = signal<ItemCarrito[]>([]);
  confirmando        = signal(false);
  errorVenta         = signal('');
  ultimaVenta        = signal<UltimaVenta | null>(null);
  busqueda           = '';

  totalVenta = computed(() =>
    this.carrito().reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
  );

  productosFiltrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    return this.productos().filter(p =>
      p.activo && p.stockActual > 0 && (
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.codigoBarras ?? '').toLowerCase().includes(q)
      )
    );
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.http.get<Producto[]>(this.API_PRODUCTOS).subscribe({
      next:  data => { this.productos.set(data); this.cargandoProductos.set(false); },
      error: ()   => this.cargandoProductos.set(false)
    });
  }

  agregarAlCarrito(producto: Producto): void {
    const actual = this.carrito();
    const idx    = actual.findIndex(i => i.productoId === producto.id);

    if (idx >= 0) {
      if (actual[idx].cantidad >= producto.stockActual) return;
      this.carrito.update(items =>
        items.map((item, i) => i === idx ? { ...item, cantidad: item.cantidad + 1 } : item)
      );
    } else {
      this.carrito.update(items => [...items, {
        productoId:      producto.id,
        nombre:          producto.nombre,
        precioUnitario:  producto.precioVenta,
        cantidad:        1,
        stockDisponible: producto.stockActual
      }]);
    }
    this.errorVenta.set('');
  }

  actualizarCantidad(index: number, nuevaCantidad: number): void {
    if (nuevaCantidad <= 0) { this.eliminarDelCarrito(index); return; }
    this.carrito.update(items =>
      items.map((item, i) => {
        if (i !== index) return item;
        return { ...item, cantidad: Math.min(nuevaCantidad, item.stockDisponible) };
      })
    );
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
    this.errorVenta.set('');
  }

  confirmarVenta(): void {
    if (this.carrito().length === 0) return;

    this.confirmando.set(true);
    this.errorVenta.set('');

    const snapshot = [...this.carrito()];
    const total    = this.totalVenta();

    const items = snapshot.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }));

    this.ventasService.registrarVenta(items).subscribe({
      next: () => {
        this.confirmando.set(false);
        this.ultimaVenta.set({
          fecha:          new Date(),
          items:          snapshot,
          total:          total,
          nombreComercio: this.auth.currentUser()?.nombreEmpresa ?? 'JujuyERP'
        });
        this.limpiarCarrito();
        this.cargarProductos();
      },
      error: (err) => {
        this.errorVenta.set(err?.error?.detail ?? 'No se pudo registrar la venta.');
        this.confirmando.set(false);
      }
    });
  }

  imprimirTicket(): void {
    const el = document.getElementById('thermal-ticket');
    if (el) el.style.display = 'block';
    window.print();
    if (el) el.style.display = 'none';
  }

  nuevaVenta(): void {
    this.ultimaVenta.set(null);
  }
}
