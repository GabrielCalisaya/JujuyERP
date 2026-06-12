import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">

      <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <span class="font-bold text-slate-800 text-sm sm:text-base">JujuyERP</span>
              <span class="hidden sm:inline text-slate-400 mx-2">·</span>
              <span class="hidden sm:inline text-slate-500 text-sm">Gestión de Stock</span>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="hidden md:block text-sm text-slate-500">{{ auth.currentUser()?.nombreEmpresa }}</span>
            <button (click)="logout()"
              class="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Catálogo de Productos</h2>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ productos().length }} producto{{ productos().length !== 1 ? 's' : '' }} en stock
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="abrirModalNuevo()"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                     bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white
                     shadow-md shadow-indigo-200 transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo Producto
            </button>
            <button (click)="aplicarAumentoMasivo()" [disabled]="actualizando()"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                     bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white
                     shadow-md shadow-amber-200 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
              @if (actualizando()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Actualizando...
              } @else {
                <span>⚡</span><span>Aumento Masivo (+10%)</span>
              }
            </button>
          </div>
        </div>

        @if (errorMsg()) {
          <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <svg class="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm text-red-600">{{ errorMsg() }}</p>
          </div>
        }

        @if (successMsg()) {
          <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
            <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm text-emerald-700">{{ successMsg() }}</p>
          </div>
        }

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          @if (cargando()) {
            <div class="flex items-center justify-center py-24">
              <svg class="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else if (productos().length === 0) {
            <div class="flex flex-col items-center justify-center py-24 text-slate-400">
              <svg class="w-14 h-14 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="font-medium text-slate-500">Sin productos registrados</p>
              <p class="text-sm mt-1">Usá el botón <strong>Nuevo Producto</strong> para comenzar.</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-100 bg-slate-50/60">
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Cód. Barras</th>
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Nombre</th>
                    <th class="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden lg:table-cell">Descripción</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Costo</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Precio Venta</th>
                    <th class="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Stock</th>
                    <th class="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of productos(); track p.id) {
                    <tr class="hover:bg-slate-50/70 transition-colors group">
                      <td class="px-5 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">{{ p.codigoBarras ?? '—' }}</td>
                      <td class="px-5 py-4 font-medium text-slate-800">{{ p.nombre }}</td>
                      <td class="px-5 py-4 text-slate-500 hidden lg:table-cell max-w-xs truncate">{{ p.descripcion ?? '—' }}</td>
                      <td class="px-5 py-4 text-right text-slate-500 tabular-nums whitespace-nowrap">
                        {{ p.costo | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-5 py-4 text-right font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {{ p.precioVenta | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-5 py-4 text-right whitespace-nowrap">
                        <span [class]="p.stockActual <= p.stockMinimo
                          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
                          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700'">
                          {{ p.stockActual }}
                        </span>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button (click)="abrirModalEditar(p)" title="Editar"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button (click)="eliminarProducto(p)" title="Eliminar"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      </main>
    </div>

    @if (mostrarModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="cerrarModal()" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-900/20
                    animate-[fadeInScale_0.2s_ease-out]"
             (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-800">
              {{ modoEdicion() ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <button (click)="cerrarModal()"
              class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400
                     hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="productoForm" (ngSubmit)="guardarProducto()" class="px-6 py-5 space-y-4">

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2 space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Yerba Mate 500g"
                  [class]="inputClass('nombre')"/>
                @if (invalid('nombre')) {
                  <p class="text-xs text-red-500">El nombre es obligatorio.</p>
                }
              </div>

              <div class="col-span-2 space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Descripción</label>
                <input type="text" formControlName="descripcion" placeholder="Descripción opcional"
                  [class]="inputClass('descripcion')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Código de Barras</label>
                <input type="text" formControlName="codigoBarras" placeholder="EAN-13"
                  [class]="inputClass('codigoBarras')"/>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Costo *</label>
                <input type="number" formControlName="costo" placeholder="0.00" min="0" step="0.01"
                  [class]="inputClass('costo')"/>
                @if (invalid('costo')) {
                  <p class="text-xs text-red-500">Ingresá un costo válido.</p>
                }
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Precio de Venta *</label>
                <input type="number" formControlName="precioVenta" placeholder="0.00" min="0" step="0.01"
                  [class]="inputClass('precioVenta')"/>
                @if (invalid('precioVenta')) {
                  <p class="text-xs text-red-500">Ingresá un precio válido.</p>
                }
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock Inicial *</label>
                <input type="number" formControlName="stockActual" placeholder="0" min="0"
                  [class]="inputClass('stockActual')"/>
                @if (invalid('stockActual')) {
                  <p class="text-xs text-red-500">Ingresá el stock.</p>
                }
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock Mínimo *</label>
                <input type="number" formControlName="stockMinimo" placeholder="0" min="0"
                  [class]="inputClass('stockMinimo')"/>
                @if (invalid('stockMinimo')) {
                  <p class="text-xs text-red-500">Ingresá el stock mínimo.</p>
                }
              </div>
            </div>

            @if (errorGuardar()) {
              <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                <p class="text-sm text-red-600">{{ errorGuardar() }}</p>
              </div>
            }

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" (click)="cerrarModal()"
                class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600
                       hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="guardando()"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                       bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200
                       active:scale-[0.98] transition-all duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100">
                @if (guardando()) {
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Guardando...
                } @else {
                  {{ modoEdicion() ? 'Guardar Cambios' : 'Crear Producto' }}
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
  `]
})
export class ProductosComponent implements OnInit {
  private http   = inject(HttpClient);
  readonly auth  = inject(AuthService);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

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

  private productoEditandoId = signal<string | null>(null);

  productoForm = this.fb.nonNullable.group({
    codigoBarras: [''],
    nombre:       ['',  Validators.required],
    descripcion:  [''],
    precioVenta:  [0,   [Validators.required, Validators.min(0)]],
    costo:        [0,   [Validators.required, Validators.min(0)]],
    stockActual:  [0,   [Validators.required, Validators.min(0)]],
    stockMinimo:  [0,   [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

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
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGuardar.set('');
    const body = this.productoForm.getRawValue();

    const request$ = this.modoEdicion()
      ? this.http.put(`${this.API}/productos/${this.productoEditandoId()}`, body, { observe: 'response' })
      : this.http.post(`${this.API}/productos`, body, { observe: 'response' });

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.successMsg.set(this.modoEdicion() ? '✓ Producto actualizado.' : '✓ Producto creado.');
        this.cargarProductos();
      },
      error: (err) => {
        this.errorGuardar.set(err?.error?.detail ?? 'No se pudo guardar el producto.');
        this.guardando.set(false);
      }
    });
  }

  eliminarProducto(p: Producto): void {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`))
      return;

    this.http.delete(`${this.API}/productos/${p.id}`).subscribe({
      next: () => {
        this.successMsg.set(`✓ "${p.nombre}" eliminado.`);
        this.cargarProductos();
      },
      error: () => this.errorMsg.set('No se pudo eliminar el producto.')
    });
  }

  aplicarAumentoMasivo(): void {
    this.actualizando.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.http.put<{ productosActualizados: number }>(
      `${this.API}/productos/actualizar-precios-masivo`,
      { porcentajeAumento: 10.0 }
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  inputClass(field: string): string {
    const ctrl = this.productoForm.get(field);
    const hasError = ctrl?.invalid && ctrl?.touched;
    return `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400
            outline-none transition-all duration-200 bg-slate-50
            focus:bg-white focus:ring-4
            ${hasError
              ? 'border-red-400 ring-red-50 focus:border-red-400'
              : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'}`;
  }

  invalid(field: string): boolean {
    const ctrl = this.productoForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
