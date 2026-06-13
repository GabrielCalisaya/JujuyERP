import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register-comercio',
    loadComponent: () =>
      import('./features/auth/register-tenant/register-tenant.component').then(m => m.RegisterTenantComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/productos.component').then(m => m.ProductosComponent)
  },
  {
    path: 'ventas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ventas/ventas.component').then(m => m.VentasComponent)
  },
  {
    path: 'ventas/historial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ventas/historial/historial-ventas.component').then(m => m.HistorialVentasComponent)
  },
  { path: '**', redirectTo: 'auth/login' }
];
