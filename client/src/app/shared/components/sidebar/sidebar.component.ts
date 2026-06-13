import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: SafeHtml;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-60 shrink-0 h-screen bg-[#070B12] border-r border-neutral-800/50
                  flex flex-col select-none print:hidden">

      <div class="px-5 py-5 border-b border-neutral-800/50">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                      flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-white tracking-tight">JujuyERP</p>
            <p class="text-[10px] text-neutral-500 truncate max-w-[130px]">
              {{ auth.currentUser()?.nombreEmpresa ?? '—' }}
            </p>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
             [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    text-neutral-500 border-l-2 border-transparent
                    hover:bg-neutral-800/60 hover:text-neutral-200
                    transition-all duration-200 ease-in-out group">
            <span class="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  [innerHTML]="item.icon"></span>
            {{ item.label }}
          </a>
        }
      </nav>

      @if (!isOnline()) {
        <div class="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20
                    flex items-center gap-2">
          <span class="text-amber-400 text-xs shrink-0">⚠️</span>
          <p class="text-amber-400 text-[10px] font-semibold leading-tight">
            Modo Offline
            <span class="block font-normal text-amber-500/70">Sin conexión</span>
          </p>
        </div>
      }

      <div class="px-4 py-4 border-t border-neutral-800/50">
        <button (click)="logout()"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                 text-neutral-500 hover:text-red-400 hover:bg-red-500/8
                 transition-all duration-200 ease-in-out">
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
