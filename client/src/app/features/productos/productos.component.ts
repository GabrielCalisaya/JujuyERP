import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

type Orden = 'none' | 'mayorPrecio' | 'menorPrecio' | 'mayorStock';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Inventario</h1>
          <p class="text-sm text-neutral-500 mt-0.5">
            {{ productosFiltrados().length }} de {{ productos().length }} producto{{ productos().length !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <button (click)="abrirModalNuevo()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                   bg-gradient-to-r from-indigo-500 to-violet-600
                   hover:from-indigo-400 hover:to-violet-500
                   shadow-lg shadow-indigo-900/40 active:scale-[0.97]
                   transition-all duration-300 ease-in-out">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo
          </button>
          <button (click)="aplicarAumentoMasivo()" [disabled]="actualizando()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                   bg-gradient-to-r from-amber-500 to-orange-500
                   hover:from-amber-400 hover:to-orange-400
                   shadow-lg shadow-amber-900/30 active:scale-[0.97]
                   transition-all duration-300 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
            @if (actualizando()) {
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            } @else {
              <span>⚡</span>
            }
            +10% Masivo
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-5">
        <div class="relative flex-1 min-w-52">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por nombre o código..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-neutral-200
                   bg-neutral-800/60 border border-neutral-700/60 placeholder-neutral-500
                   outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20
                   transition-all duration-200"/>
        </div>

        <button (click)="soloStockCritico.set(!soloStockCritico())"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium
                 border transition-all duration-200 ease-in-out"
          [class]="soloStockCritico()
            ? 'bg-red-500/15 border-red-500/40 text-red-400'
            : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Stock Crítico
        </button>

        <select [(ngModel)]="ordenar"
          class="px-3.5 py-2.5 rounded-xl text-sm text-neutral-300
                 bg-neutral-800/60 border border-neutral-700/60
                 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20
                 transition-all duration-200 cursor-pointer">
          <option value="none">Ordenar por…</option>
          <option value="mayorPrecio">Mayor precio</option>
          <option value="menorPrecio">Menor precio</option>
          <option value="mayorStock">Mayor stock</option>
        </select>
      </div>

      @if (errorMsg()) {
        <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <p class="text-sm text-red-400">{{ errorMsg() }}</p>
        </div>
      }
      @if (successMsg()) {
        <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <p class="text-sm text-emerald-400">{{ successMsg() }}</p>
        </div>
      }

      <div class="bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800/50 overflow-hidden">

        @if (cargando()) {
          <div class="flex items-center justify-center py-24">
            <svg class="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        } @else if (productosFiltrados().length === 0) {
          <div class="flex flex-col items-center justify-center py-24">
            <svg class="w-14 h-14 mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p class="font-medium text-neutral-400">
              {{ productos().length === 0 ? 'Sin productos registrados' : 'Sin resultados para los filtros aplicados' }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-800/70">
                  <th class="text-left px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Código</th>
                  <th class="text-left px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Nombre</th>
                  <th class="text-left px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest hidden lg:table-cell">Descripción</th>
                  <th class="text-right px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Costo</th>
                  <th class="text-right px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Precio</th>
                  <th class="text-right px-5 py-3.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Stock</th>
                  <th class="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-800/50">
                @for (p of productosFiltrados(); track p.id) {
                  <tr class="hover:bg-neutral-800/40 transition-all duration-300 ease-in-out group">
                    <td class="px-5 py-4 text-neutral-500 font-mono text-xs whitespace-nowrap">
                      {{ p.codigoBarras ?? '—' }}
                    </td>
                    <td class="px-5 py-4 font-medium text-neutral-200">{{ p.nombre }}</td>
                    <td class="px-5 py-4 text-neutral-500 hidden lg:table-cell max-w-xs truncate text-xs">
                      {{ p.descripcion ?? '—' }}
                    </td>
                    <td class="px-5 py-4 text-right text-neutral-500 tabular-nums whitespace-nowrap">
                      {{ p.costo | currency:'ARS':'symbol':'1.2-2' }}
                    </td>
                    <td class="px-5 py-4 text-right font-semibold text-neutral-200 tabular-nums whitespace-nowrap">
                      {{ p.precioVenta | currency:'ARS':'symbol':'1.2-2' }}
                    </td>
                    <td class="px-5 py-4 text-right whitespace-nowrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                            [class]="p.stockActual <= p.stockMinimo
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'">
                        {{ p.stockActual }}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1
                                  opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button (click)="abrirModalEditar(p)" title="Editar"
                          class="p-1.5 rounded-lg text-neutral-600 hover:text-indigo-400
                                 hover:bg-indigo-500/10 transition-all duration-150">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button (click)="eliminarProducto(p)" title="Eliminar"
                          class="p-1.5 rounded-lg text-neutral-600 hover:text-red-400
                                 hover:bg-red-500/10 transition-all duration-150">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>

    @if (mostrarModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="cerrarModal()">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-lg bg-[#0F1420] border border-neutral-800/60 rounded-3xl shadow-2xl"
             (click)="$event.stopPropagation()"
             style="animation: fadeInScale 0.18s ease-out">

          <div class="flex items-center justify-between px-6 py-5 border-b border-neutral-800/60">
            <h3 class="text-base font-bold text-white">
              {{ modoEdicion() ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <button (click)="cerrarModal()"
              class="w-8 h-8 flex items-center justify-center rounded-full
                     text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800
                     transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">

              <div class="col-span-2 space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Nombre *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Yerba Mate 500g"
                  [class]="inputClass('nombre')"/>
                @if (invalid('nombre')) { <p class="text-xs text-red-400">El nombre es obligatorio.</p> }
              </div>

              <div class="col-span-2 space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Descripción</label>
                <input type="text" formControlName="descripcion" placeholder="Descripción opcional"
                  [class]="inputClass('descripcion')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Código de Barras</label>
                <input type="text" formControlName="codigoBarras" placeholder="EAN-13"
                  [class]="inputClass('codigoBarras')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Costo *</label>
                <input type="number" formControlName="costo" placeholder="0.00" min="0" step="0.01"
                  [class]="inputClass('costo')"/>
                @if (invalid('costo')) { <p class="text-xs text-red-400">Ingresá un costo válido.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Precio de Venta *</label>
                <input type="number" formControlName="precioVenta" placeholder="0.00" min="0" step="0.01"
                  [class]="inputClass('precioVenta')"/>
                @if (invalid('precioVenta')) { <p class="text-xs text-red-400">Ingresá un precio válido.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Stock Inicial *</label>
                <input type="number" formControlName="stockActual" placeholder="0" min="0"
                  [class]="inputClass('stockActual')"/>
                @if (invalid('stockActual')) { <p class="text-xs text-red-400">Ingresá el stock.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Stock Mínimo *</label>
                <input type="number" formControlName="stockMinimo" placeholder="0" min="0"
                  [class]="inputClass('stockMinimo')"/>
                @if (invalid('stockMinimo')) { <p class="text-xs text-red-400">Ingresá el mínimo.</p> }
              </div>
            </div>

            @if (errorGuardar()) {
              <div class="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-sm text-red-400">{{ errorGuardar() }}</p>
              </div>
            }

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" (click)="cerrarModal()"
                class="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400
                       hover:text-neutral-200 hover:bg-neutral-800 transition-all duration-200">
                Cancelar
              </button>
              <button type="submit" [disabled]="guardando()"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                       bg-gradient-to-r from-indigo-500 to-violet-600
                       hover:from-indigo-400 hover:to-violet-500
                       shadow-lg shadow-indigo-900/40 active:scale-[0.97]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
                @if (guardando()) {
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ modoEdicion() ? 'Guardar Cambios' : 'Crear Producto' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.96) translateY(6px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
  `]
})
export class ProductosComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  private readonly API = 'http://localhost:5075/api';

  productos    = signal<Producto[]>([]);
  cargando     = signal(true);
  actualizando = signal(false);
  guardando    = signal(false);
  mostrarModal = signal(false);
  modoEdicion  = signal(false);
  errorMsg     = signal('');
  successMsg   = signal('');
  errorGuardar = signal('');

  busqueda        = '';
  soloStockCritico = signal(false);
  ordenar          = 'none' as Orden;

  private productoEditandoId = signal<string | null>(null);

  productosFiltrados = computed(() => {
    const q    = this.busqueda.toLowerCase().trim();
    const crit = this.soloStockCritico();
    let lista  = this.productos().filter(p => {
      const matchQ    = !q || p.nombre.toLowerCase().includes(q) || (p.codigoBarras ?? '').toLowerCase().includes(q);
      const matchCrit = !crit || p.stockActual <= p.stockMinimo;
      return matchQ && matchCrit;
    });

    if (this.ordenar === 'mayorPrecio') lista = [...lista].sort((a, b) => b.precioVenta - a.precioVenta);
    if (this.ordenar === 'menorPrecio') lista = [...lista].sort((a, b) => a.precioVenta - b.precioVenta);
    if (this.ordenar === 'mayorStock')  lista = [...lista].sort((a, b) => b.stockActual  - a.stockActual);

    return lista;
  });

  productoForm = this.fb.nonNullable.group({
    codigoBarras: [''],
    nombre:       ['',  Validators.required],
    descripcion:  [''],
    precioVenta:  [0,   [Validators.required, Validators.min(0)]],
    costo:        [0,   [Validators.required, Validators.min(0)]],
    stockActual:  [0,   [Validators.required, Validators.min(0)]],
    stockMinimo:  [0,   [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void { this.cargarProductos(); }

  cargarProductos(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.http.get<Producto[]>(`${this.API}/productos`).subscribe({
      next:  data => { this.productos.set(data); this.cargando.set(false); },
      error: ()   => { this.errorMsg.set('No se pudieron cargar los productos.'); this.cargando.set(false); }
    });
  }

  abrirModalNuevo(): void {
    this.modoEdicion.set(false);
    this.productoEditandoId.set(null);
    this.productoForm.reset({ precioVenta: 0, costo: 0, stockActual: 0, stockMinimo: 0 });
    this.errorGuardar.set('');
    this.mostrarModal.set(true);
  }

  abrirModalEditar(p: Producto): void {
    this.modoEdicion.set(true);
    this.productoEditandoId.set(p.id);
    this.productoForm.setValue({
      codigoBarras: p.codigoBarras ?? '',
      nombre:       p.nombre,
      descripcion:  p.descripcion ?? '',
      precioVenta:  p.precioVenta,
      costo:        p.costo,
      stockActual:  p.stockActual,
      stockMinimo:  p.stockMinimo
    });
    this.errorGuardar.set('');
    this.mostrarModal.set(true);
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) { this.productoForm.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorGuardar.set('');
    const body = this.productoForm.getRawValue();

    const req$ = this.modoEdicion()
      ? this.http.put(`${this.API}/productos/${this.productoEditandoId()}`, body, { observe: 'response' })
      : this.http.post(`${this.API}/productos`, body, { observe: 'response' });

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.successMsg.set(this.modoEdicion() ? '✓ Producto actualizado.' : '✓ Producto creado.');
        this.cargarProductos();
      },
      error: err => { this.errorGuardar.set(err?.error?.detail ?? 'No se pudo guardar.'); this.guardando.set(false); }
    });
  }

  eliminarProducto(p: Producto): void {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.http.delete(`${this.API}/productos/${p.id}`).subscribe({
      next:  () => { this.successMsg.set(`✓ "${p.nombre}" eliminado.`); this.cargarProductos(); },
      error: () => this.errorMsg.set('No se pudo eliminar el producto.')
    });
  }

  aplicarAumentoMasivo(): void {
    this.actualizando.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.http.put<{ productosActualizados: number }>(
      `${this.API}/productos/actualizar-precios-masivo`, { porcentajeAumento: 10.0 }
    ).subscribe({
      next: res => {
        this.successMsg.set(`✓ Aumento aplicado a ${res.productosActualizados} producto${res.productosActualizados !== 1 ? 's' : ''}.`);
        this.actualizando.set(false);
        this.cargarProductos();
      },
      error: () => { this.errorMsg.set('No se pudo aplicar el aumento masivo.'); this.actualizando.set(false); }
    });
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.productoEditandoId.set(null);
    this.productoForm.reset({ precioVenta: 0, costo: 0, stockActual: 0, stockMinimo: 0 });
    this.errorGuardar.set('');
  }

  inputClass(field: string): string {
    const err = this.invalid(field);
    return `w-full px-3.5 py-2.5 rounded-xl border text-sm text-neutral-200 placeholder-neutral-600
            bg-neutral-800/60 outline-none transition-all duration-200
            focus:ring-2
            ${err
              ? 'border-red-500/50 ring-red-500/15 focus:border-red-400'
              : 'border-neutral-700/60 focus:border-indigo-500/60 focus:ring-indigo-500/20'}`;
  }

  invalid(field: string): boolean {
    const ctrl = this.productoForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
