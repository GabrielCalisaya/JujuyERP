import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { VentasService } from '../../core/services/ventas.service';

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

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-100 flex flex-col">

      <header class="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="font-bold text-slate-800 text-sm">JujuyERP</span>
            <span class="text-slate-300">|</span>
            <span class="text-sm font-semibold text-indigo-600">Punto de Venta</span>
          </div>
          <nav class="flex items-center gap-1">
            <a routerLink="/productos"
              class="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              Catálogo
            </a>
            <a routerLink="/ventas"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50">
              Ventas
            </a>
          </nav>
        </div>
      </header>

      <div class="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-5 grid grid-cols-3 gap-5 min-h-0">

        <div class="col-span-2 flex flex-col gap-4">

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
            <div class="flex items-center justify-center py-16">
              <svg class="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else {
            <div class="overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm"
                 style="max-height: calc(100vh - 13rem)">
              @if (productosFiltrados().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                  <svg class="w-10 h-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-sm font-medium text-slate-500">Sin resultados para "{{ busqueda }}"</p>
                </div>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (p of productosFiltrados(); track p.id) {
                    <li (click)="agregarAlCarrito(p)"
                      class="flex items-center justify-between px-4 py-3 cursor-pointer
                             hover:bg-indigo-50 active:bg-indigo-100 transition-colors select-none
                             group"
                      [class.opacity-40]="p.stockActual <= 0"
                      [class.pointer-events-none]="p.stockActual <= 0">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-slate-800 text-sm truncate">{{ p.nombre }}</span>
                          @if (p.stockActual <= p.stockMinimo && p.stockActual > 0) {
                            <span class="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                         bg-amber-100 text-amber-700">Stock bajo</span>
                          }
                          @if (p.stockActual <= 0) {
                            <span class="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                         bg-red-100 text-red-700">Sin stock</span>
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
              <h2 class="font-bold text-slate-800 text-sm">Ticket de Venta</h2>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ carrito().length }} ítem{{ carrito().length !== 1 ? 's' : '' }}
              </p>
            </div>
            @if (carrito().length > 0) {
              <button (click)="limpiarCarrito()"
                class="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50
                       px-2 py-1 rounded-lg transition-colors">
                Limpiar
              </button>
            }
          </div>

          <div class="flex-1 overflow-y-auto px-4 py-3" style="max-height: calc(100vh - 22rem)">
            @if (carrito().length === 0) {
              <div class="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <p class="text-sm font-medium text-slate-400">Seleccioná productos</p>
                <p class="text-xs mt-1 text-slate-300">del catálogo de la izquierda</p>
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
                        <span class="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">
                          {{ item.cantidad }}
                        </span>
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
                        <div class="text-xs text-slate-400 tabular-nums">
                          {{ item.precioUnitario | currency:'ARS':'symbol':'1.2-2' }} c/u
                        </div>
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

            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-500">Subtotal</span>
              <span class="text-sm text-slate-600 tabular-nums font-medium">
                {{ totalVenta() | currency:'ARS':'symbol':'1.2-2' }}
              </span>
            </div>

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

            @if (ventaExitosa()) {
              <div class="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p class="text-xs font-semibold text-emerald-700">{{ ventaExitosa() }}</p>
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
                <span>💳</span>
                <span>Confirmar y Facturar Venta</span>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class VentasComponent implements OnInit {
  private http           = inject(HttpClient);
  private ventasService  = inject(VentasService);
  private router         = inject(Router);

  private readonly API_PRODUCTOS = 'http://localhost:5075/api/productos';

  productos           = signal<Producto[]>([]);
  cargandoProductos   = signal(true);
  carrito             = signal<ItemCarrito[]>([]);
  confirmando         = signal(false);
  errorVenta          = signal('');
  ventaExitosa        = signal('');
  busqueda            = '';

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
        items.map((item, i) =>
          i === idx ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      this.carrito.update(items => [
        ...items,
        {
          productoId:      producto.id,
          nombre:          producto.nombre,
          precioUnitario:  producto.precioVenta,
          cantidad:        1,
          stockDisponible: producto.stockActual
        }
      ]);
    }

    this.errorVenta.set('');
    this.ventaExitosa.set('');
  }

  actualizarCantidad(index: number, nuevaCantidad: number): void {
    if (nuevaCantidad <= 0) {
      this.eliminarDelCarrito(index);
      return;
    }
    this.carrito.update(items =>
      items.map((item, i) => {
        if (i !== index) return item;
        const cantidad = Math.min(nuevaCantidad, item.stockDisponible);
        return { ...item, cantidad };
      })
    );
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
    this.errorVenta.set('');
    this.ventaExitosa.set('');
  }

  confirmarVenta(): void {
    if (this.carrito().length === 0) return;

    this.confirmando.set(true);
    this.errorVenta.set('');
    this.ventaExitosa.set('');

    const items = this.carrito().map(i => ({
      productoId: i.productoId,
      cantidad:   i.cantidad
    }));

    this.ventasService.registrarVenta(items).subscribe({
      next: () => {
        const total = this.totalVenta();
        this.confirmando.set(false);
        this.limpiarCarrito();
        this.ventaExitosa.set(`✓ Venta registrada por ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}`);
        this.cargarProductos();
      },
      error: (err) => {
        this.errorVenta.set(err?.error?.detail ?? 'No se pudo registrar la venta.');
        this.confirmando.set(false);
      }
    });
  }
}
