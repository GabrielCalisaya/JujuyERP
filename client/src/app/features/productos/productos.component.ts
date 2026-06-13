import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';

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
    <div class="p-8 max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold tracking-tight
                     bg-gradient-to-r from-white via-neutral-200 to-neutral-500
                     bg-clip-text text-transparent">
            Inventario
          </h1>
          <p class="text-sm text-neutral-600 mt-1.5">
            {{ productosFiltrados().length }} de {{ productos().length }} producto{{ productos().length !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="abrirModalNuevo()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white
                   bg-gradient-to-b from-indigo-500 to-indigo-700 border border-indigo-400/30
                   shadow-[0_0_20px_rgba(99,102,241,0.18)] hover:from-indigo-400 hover:to-indigo-600
                   active:scale-[0.97] transition-all duration-200 ease-out">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo
          </button>
          <button (click)="aplicarAumentoMasivo()" [disabled]="actualizando()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-200
                   bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700/50
                   hover:from-neutral-700 hover:to-neutral-900 active:scale-[0.97]
                   transition-all duration-200 ease-out disabled:opacity-40 disabled:cursor-not-allowed">
            @if (actualizando()) {
              <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            } @else { <span>⚡</span> }
            +10% Masivo
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5 mb-5">
        <div class="relative flex-1 min-w-52">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="text" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"
            placeholder="Buscar por nombre o código…"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-neutral-300
                   bg-white/[0.04] border border-white/[0.07] placeholder-neutral-600
                   outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30
                   transition-all duration-200"/>
        </div>

        <button (click)="soloStockCritico.set(!soloStockCritico())"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-medium border
                 transition-all duration-200 ease-out"
          [class]="soloStockCritico()
            ? 'bg-red-500/[0.1] border-red-500/30 text-red-400'
            : 'bg-white/[0.03] border-white/[0.07] text-neutral-500 hover:border-white/[0.1] hover:text-neutral-300'">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Stock crítico
        </button>

        <select [ngModel]="ordenar()" (ngModelChange)="ordenar.set($event)"
          class="px-3.5 py-2.5 rounded-xl text-[13px] text-neutral-400 cursor-pointer
                 bg-white/[0.03] border border-white/[0.07] outline-none
                 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30
                 transition-all duration-200">
          <option value="none">Ordenar…</option>
          <option value="mayorPrecio">Mayor precio</option>
          <option value="menorPrecio">Menor precio</option>
          <option value="mayorStock">Mayor stock</option>
        </select>
      </div>

      <div class="rounded-2xl border border-white/[0.06] bg-[#0f1424]/40 backdrop-blur-xl overflow-hidden">

        @if (cargando()) {
          <div class="px-3 py-2">
            <div class="flex items-center gap-4 px-4 py-2 mb-1">
              <div class="skeleton h-2 w-20 rounded-md"></div>
              <div class="skeleton h-2 flex-1 rounded-md"></div>
              <div class="skeleton h-2 w-24 rounded-md"></div>
              <div class="skeleton h-2 w-24 rounded-md"></div>
              <div class="skeleton h-2 w-16 rounded-md"></div>
              <div class="skeleton h-2 w-14 rounded-md"></div>
              <div class="w-16"></div>
            </div>
            <div class="space-y-1">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="flex items-center gap-4 px-4 py-3.5 rounded-xl">
                  <div class="skeleton h-2.5 w-24 rounded-md"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="skeleton h-3.5 rounded-md"
                         [style.width]="[60,75,50,80,65,55][i-1] + '%'"></div>
                    <div class="skeleton h-2.5 w-2/5 rounded-md hidden lg:block"></div>
                  </div>
                  <div class="skeleton h-3 w-28 rounded-md"></div>
                  <div class="skeleton h-3 w-28 rounded-md"></div>
                  <div class="skeleton h-5 w-10 rounded-full"></div>
                  <div class="w-16"></div>
                </div>
              }
            </div>
          </div>
        } @else if (productosFiltrados().length === 0) {
          <div class="relative flex flex-col items-center justify-center py-20 overflow-hidden">
            <div class="absolute inset-0 pointer-events-none"
                 style="background:radial-gradient(ellipse 60% 40% at 50% 60%,rgba(99,102,241,0.05) 0%,transparent 70%)"></div>
            <div class="relative w-20 h-20 rounded-3xl bg-[#0f1424]/60 border border-white/[0.07]
                        flex items-center justify-center mb-6 shadow-2xl">
              <svg class="w-9 h-9 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <div class="absolute inset-0 rounded-3xl"
                   style="box-shadow:inset 0 0 24px rgba(99,102,241,0.06)"></div>
            </div>
            @if (productos().length === 0) {
              <p class="text-[15px] font-semibold text-neutral-400 mb-2">Catálogo vacío</p>
              <p class="text-[13px] text-neutral-600 text-center max-w-xs leading-relaxed mb-6">
                Empezá cargando tu stock usando el botón <span class="text-indigo-400 font-semibold">+ Nuevo</span>.
              </p>
              <div class="flex flex-col gap-2 text-[12px] text-neutral-600 max-w-xs">
                @for (tip of tips; track tip.text) {
                  <div class="flex items-start gap-2.5">
                    <span class="text-indigo-500/60 mt-0.5 shrink-0">{{ tip.icon }}</span>
                    <span>{{ tip.text }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="text-[15px] font-semibold text-neutral-400 mb-2">Sin resultados</p>
              <p class="text-[13px] text-neutral-600 text-center">
                Intentá con otro término o quitá los filtros activos.
              </p>
            }
          </div>
        } @else {
          <div class="px-3 py-2">
            <div class="flex items-center gap-4 px-4 py-2 mb-1">
              <span class="w-24 shrink-0 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Código</span>
              <span class="flex-1 text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Nombre</span>
              <span class="w-28 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Costo</span>
              <span class="w-28 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Precio</span>
              <span class="w-20 shrink-0 text-center text-[10px] font-semibold text-indigo-400/80 uppercase tracking-[0.12em]">Margen</span>
              <span class="w-16 shrink-0 text-right text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.12em]">Stock</span>
              <span class="w-16 shrink-0"></span>
            </div>

            <div class="space-y-0.5">
              @for (p of productosFiltrados(); track p.id) {
                <div class="group flex items-center gap-4 px-4 py-3.5 rounded-xl border-l-2 transition-all duration-300 ease-out cursor-default"
                     [class]="confirmDeleteId() === p.id
                       ? 'border-l-red-500/60 bg-red-500/[0.03]'
                       : 'border-transparent hover:bg-white/[0.02] hover:border-l-indigo-500'">

                  <span class="w-24 shrink-0 text-[11px] text-neutral-600 font-mono truncate">
                    {{ p.codigoBarras ?? '—' }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-medium text-neutral-200 truncate">{{ p.nombre }}</p>
                    @if (p.descripcion) {
                      <p class="text-[11px] text-neutral-600 truncate hidden lg:block mt-0.5">{{ p.descripcion }}</p>
                    }
                  </div>
                  <span class="w-28 shrink-0 text-right text-[13px] text-neutral-500 tabular-nums">
                    {{ p.costo | currency:'ARS':'symbol':'1.0-0' }}
                  </span>
                  <span class="w-28 shrink-0 text-right text-[13px] font-semibold text-neutral-200 tabular-nums">
                    {{ p.precioVenta | currency:'ARS':'symbol':'1.0-0' }}
                  </span>
                  <span class="w-20 shrink-0 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                          [class]="margenClass(p.precioVenta, p.costo)">
                      {{ margen(p.precioVenta, p.costo) }}%
                    </span>
                  </span>
                  <span class="w-16 shrink-0 text-right">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                          [class]="p.stockActual <= p.stockMinimo
                            ? 'bg-red-500/[0.1] text-red-400 border-red-500/20'
                            : 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/20'">
                      {{ p.stockActual }}
                    </span>
                  </span>

                  <div class="w-16 shrink-0 flex items-center justify-end gap-0.5"
                       [class]="confirmDeleteId() === p.id
                         ? 'opacity-100'
                         : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'">
                    @if (confirmDeleteId() === p.id) {
                      <button (click)="confirmarEliminar(p)"
                        class="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-300
                               bg-red-500/[0.15] border border-red-500/30
                               hover:bg-red-500/[0.25] transition-all duration-150">
                        Sí
                      </button>
                      <button (click)="cancelarEliminar()"
                        class="px-2 py-1 rounded-lg text-[11px] text-neutral-600
                               hover:text-neutral-300 transition-colors duration-150">
                        No
                      </button>
                    } @else {
                      <button (click)="abrirModalEditar(p)"
                        class="p-1.5 rounded-lg text-neutral-600 hover:text-indigo-400 hover:bg-indigo-500/[0.1]
                               transition-all duration-150">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="pedirConfirmDelete(p.id)"
                        class="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/[0.1]
                               transition-all duration-150">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    }
                  </div>

                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>

    @if (mostrarModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="cerrarModal()">
        <div class="absolute inset-0 bg-black/75 backdrop-blur-md"></div>

        <div class="relative w-full max-w-lg rounded-3xl overflow-hidden
                    bg-[#0c1120] border border-white/[0.07] shadow-2xl"
             (click)="$event.stopPropagation()"
             style="animation:fadeInScale .18s ease-out">

          <div class="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 class="text-[15px] font-bold text-white">
              {{ modoEdicion() ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <button (click)="cerrarModal()"
              class="w-7 h-7 flex items-center justify-center rounded-full
                     text-neutral-600 hover:text-neutral-200 hover:bg-white/[0.06]
                     transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">

              <div class="col-span-2 space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Nombre *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Yerba Mate 500g" [class]="iClass('nombre')"/>
                @if (invalid('nombre')) { <p class="text-[11px] text-red-400">El nombre es obligatorio.</p> }
              </div>

              <div class="col-span-2 space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Descripción</label>
                <input type="text" formControlName="descripcion" placeholder="Opcional" [class]="iClass('descripcion')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Código de barras</label>
                <input type="text" formControlName="codigoBarras" placeholder="EAN-13" [class]="iClass('codigoBarras')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Costo *</label>
                <input type="number" formControlName="costo" placeholder="0.00" min="0" step="0.01" [class]="iClass('costo')"/>
                @if (invalid('costo')) { <p class="text-[11px] text-red-400">Costo inválido.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Precio venta *</label>
                <input type="number" formControlName="precioVenta" placeholder="0.00" min="0" step="0.01" [class]="iClass('precioVenta')"/>
                @if (invalid('precioVenta')) { <p class="text-[11px] text-red-400">Precio inválido.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Stock inicial *</label>
                <input type="number" formControlName="stockActual" placeholder="0" min="0" [class]="iClass('stockActual')"/>
                @if (invalid('stockActual')) { <p class="text-[11px] text-red-400">Requerido.</p> }
              </div>

              <div class="space-y-1.5">
                <label class="block text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Stock mínimo *</label>
                <input type="number" formControlName="stockMinimo" placeholder="0" min="0" [class]="iClass('stockMinimo')"/>
                @if (invalid('stockMinimo')) { <p class="text-[11px] text-red-400">Requerido.</p> }
              </div>

            </div>

            @if (errorGuardar()) {
              <div class="px-3 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                <p class="text-[13px] text-red-400">{{ errorGuardar() }}</p>
              </div>
            }

            <div class="flex items-center justify-end gap-2.5 pt-1">
              <button type="button" (click)="cerrarModal()"
                class="px-4 py-2.5 rounded-xl text-[13px] font-medium text-neutral-500
                       hover:text-neutral-200 hover:bg-white/[0.04] transition-all duration-200">
                Cancelar
              </button>
              <button type="submit" [disabled]="guardando()"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white
                       bg-gradient-to-b from-indigo-500 to-indigo-700 border border-indigo-400/30
                       shadow-[0_0_16px_rgba(99,102,241,0.2)] hover:from-indigo-400 hover:to-indigo-600
                       active:scale-[0.97] transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed">
                @if (guardando()) {
                  <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                }
                {{ modoEdicion() ? 'Guardar cambios' : 'Crear producto' }}
              </button>
            </div>
          </form>
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
export class ProductosComponent implements OnInit {
  private http  = inject(HttpClient);
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);
  private readonly API = 'http://localhost:5075/api';

  productos      = signal<Producto[]>([]);
  cargando       = signal(true);
  actualizando   = signal(false);
  guardando      = signal(false);
  mostrarModal   = signal(false);
  modoEdicion    = signal(false);
  errorGuardar   = signal('');
  confirmDeleteId = signal<string | null>(null);
  private confirmTimer?: ReturnType<typeof setTimeout>;
  private editandoId = signal<string | null>(null);

  busqueda         = signal('');
  soloStockCritico = signal(false);
  ordenar          = signal<Orden>('none');

  productosFiltrados = computed(() => {
    const q    = this.busqueda().toLowerCase().trim();
    const crit = this.soloStockCritico();
    const ord  = this.ordenar();

    let lista = this.productos().filter(p => {
      const mQ = !q || p.nombre.toLowerCase().includes(q) || (p.codigoBarras ?? '').toLowerCase().includes(q);
      const mC = !crit || p.stockActual <= p.stockMinimo;
      return mQ && mC;
    });

    if (ord === 'mayorPrecio') lista = [...lista].sort((a, b) => b.precioVenta - a.precioVenta);
    if (ord === 'menorPrecio') lista = [...lista].sort((a, b) => a.precioVenta - b.precioVenta);
    if (ord === 'mayorStock')  lista = [...lista].sort((a, b) => b.stockActual  - a.stockActual);

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
    this.http.get<Producto[]>(`${this.API}/productos`).subscribe({
      next:  data => { this.productos.set(data); this.cargando.set(false); },
      error: ()   => {
        this.toast.error('No se pudieron cargar los productos.');
        this.cargando.set(false);
      }
    });
  }

  abrirModalNuevo(): void {
    this.modoEdicion.set(false);
    this.editandoId.set(null);
    this.productoForm.reset({ precioVenta: 0, costo: 0, stockActual: 0, stockMinimo: 0 });
    this.errorGuardar.set('');
    this.mostrarModal.set(true);
  }

  abrirModalEditar(p: Producto): void {
    this.modoEdicion.set(true);
    this.editandoId.set(p.id);
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

    const req$ = this.modoEdicion()
      ? this.http.put(`${this.API}/productos/${this.editandoId()}`, this.productoForm.getRawValue(), { observe: 'response' })
      : this.http.post(`${this.API}/productos`, this.productoForm.getRawValue(), { observe: 'response' });

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.toast.success(this.modoEdicion() ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
        this.cargarProductos();
      },
      error: err => {
        this.errorGuardar.set(err?.error?.detail ?? 'Error al guardar.');
        this.guardando.set(false);
      }
    });
  }

  pedirConfirmDelete(id: string): void {
    clearTimeout(this.confirmTimer);
    this.confirmDeleteId.set(id);
    this.confirmTimer = setTimeout(() => this.confirmDeleteId.set(null), 3000);
  }

  cancelarEliminar(): void {
    clearTimeout(this.confirmTimer);
    this.confirmDeleteId.set(null);
  }

  confirmarEliminar(p: Producto): void {
    clearTimeout(this.confirmTimer);
    this.confirmDeleteId.set(null);
    this.http.delete(`${this.API}/productos/${p.id}`).subscribe({
      next:  () => { this.toast.success(`"${p.nombre}" eliminado.`); this.cargarProductos(); },
      error: () => this.toast.error('No se pudo eliminar el producto.')
    });
  }

  aplicarAumentoMasivo(): void {
    this.actualizando.set(true);
    this.http.put<{ productosActualizados: number }>(
      `${this.API}/productos/actualizar-precios-masivo`, { porcentajeAumento: 10.0 }
    ).subscribe({
      next: res => {
        this.toast.success(`Aumento aplicado a ${res.productosActualizados} producto${res.productosActualizados !== 1 ? 's' : ''}.`);
        this.actualizando.set(false);
        this.cargarProductos();
      },
      error: () => { this.toast.error('No se pudo aplicar el aumento.'); this.actualizando.set(false); }
    });
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.editandoId.set(null);
    this.productoForm.reset({ precioVenta: 0, costo: 0, stockActual: 0, stockMinimo: 0 });
    this.errorGuardar.set('');
  }

  iClass(field: string): string {
    const err = this.invalid(field);
    return `w-full px-3.5 py-2.5 rounded-xl text-[13px] text-neutral-200 placeholder-neutral-600
            bg-white/[0.04] border outline-none transition-all duration-200 focus:ring-4
            ${err
              ? 'border-red-500/40 focus:ring-red-500/[0.08] focus:border-red-500/50'
              : 'border-white/[0.07] focus:ring-indigo-500/10 focus:border-indigo-500/30'}`;
  }

  invalid(field: string): boolean {
    const c = this.productoForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  margen(precio: number, costo: number): number {
    if (precio <= 0) return 0;
    return Math.round(((precio - costo) / precio) * 100);
  }

  margenClass(precio: number, costo: number): string {
    const m = this.margen(precio, costo);
    if (m >= 40) return 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/20';
    if (m >= 20) return 'bg-blue-500/[0.1] text-blue-400 border-blue-500/20';
    if (m > 0)   return 'bg-amber-500/[0.1] text-amber-400 border-amber-500/20';
    return 'bg-red-500/[0.1] text-red-400 border-red-500/20';
  }

  readonly tips = [
    { icon: '→', text: 'Completá el código de barras para agilizar la venta con escáner.' },
    { icon: '→', text: 'El stock mínimo activa las alertas críticas en el Dashboard.' },
    { icon: '→', text: 'El margen de ganancia se calcula automáticamente a partir de costo y precio.' },
  ];
}
