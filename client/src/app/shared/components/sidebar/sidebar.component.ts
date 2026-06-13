import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
  icon: SafeHtml;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-[220px] shrink-0 h-screen flex flex-col select-none print:hidden
                  bg-[#06090f] border-r border-white/[0.05]">

      <div class="px-4 py-5 border-b border-white/[0.05]">
        <div class="flex items-center gap-2.5">
          <div class="relative w-8 h-8 rounded-xl shrink-0 overflow-hidden
                      bg-gradient-to-br from-indigo-500 to-violet-700
                      shadow-[0_0_16px_rgba(99,102,241,0.35)]">
            <svg class="w-4 h-4 text-white absolute inset-0 m-auto"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-bold text-white tracking-tight">JujuyERP</p>
            <p class="text-[10px] text-neutral-600 truncate max-w-[130px]">
              {{ auth.currentUser()?.nombreEmpresa ?? '—' }}
            </p>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        @for (item of navItems; track item.route) {
          <a #rla="routerLinkActive"
             routerLinkActive
             [routerLink]="item.route"
             [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
             class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    transition-all duration-200 ease-out border-l-2 overflow-hidden"
             [class]="rla.isActive
               ? 'bg-gradient-to-r from-indigo-500/[0.14] to-transparent border-indigo-400/60 text-indigo-300'
               : 'border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.03]'">
            <span class="w-4 h-4 shrink-0 transition-transform duration-200 ease-out"
                  [class.scale-110]="rla.isActive"
                  [innerHTML]="item.icon"></span>
            <span class="flex-1">{{ item.label }}</span>
            @if (rla.isActive) {
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    style="box-shadow:0 0 8px 3px rgba(129,140,248,0.55)"></span>
            }
          </a>
        }
      </nav>

      @if (!isOnline()) {
        <div class="mx-2.5 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2
                    bg-amber-500/[0.07] border border-amber-500/20">
          <span class="text-amber-400 text-xs">⚠️</span>
          <p class="text-[11px] font-semibold text-amber-400/80 leading-tight">
            Modo Offline
            <span class="block font-normal text-amber-500/50">Sin conexión</span>
          </p>
        </div>
      }

      <div class="px-3 py-4 border-t border-white/[0.05]">
        <button (click)="logout()"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px]
                 text-neutral-600 hover:text-red-400 hover:bg-red-500/[0.07]
                 transition-all duration-200 ease-out">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Cerrar sesión
        </button>
      </div>

    </aside>
  `
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly auth      = inject(AuthService);
  private  router    = inject(Router);
  private  sanitizer = inject(DomSanitizer);

  isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  private onOnline  = () => this.isOnline.set(true);
  private onOffline = () => this.isOnline.set(false);

  ngOnInit(): void {
    window.addEventListener('online',  this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online',  this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  private svg(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/></svg>`
    );
  }

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      exact: true,
      icon:  this.svg('M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z')
    },
    {
      label: 'Inventario',
      route: '/productos',
      icon:  this.svg('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4')
    },
    {
      label: 'Punto de Venta',
      route: '/ventas',
      exact: true,
      icon:  this.svg('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z')
    },
    {
      label: 'Historial',
      route: '/ventas/historial',
      icon:  this.svg('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')
    }
  ];

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
