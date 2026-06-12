import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">JujuyERP</h1>
          <p class="text-slate-500 text-sm mt-1">Ingresá a tu cuenta</p>
        </div>

        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="correo@empresa.com"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                       text-slate-800 placeholder-slate-400 text-sm
                       outline-none transition-all duration-200
                       focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50
                       [&.ng-invalid.ng-touched]:border-red-400 [&.ng-invalid.ng-touched]:ring-red-50"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-xs text-red-500 mt-1">Ingresá un email válido.</p>
              }
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Contraseña</label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50
                         text-slate-800 placeholder-slate-400 text-sm
                         outline-none transition-all duration-200
                         focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50
                         [&.ng-invalid.ng-touched]:border-red-400 [&.ng-invalid.ng-touched]:ring-red-50"
                />
                <button type="button" (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  @if (showPassword()) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  }
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs text-red-500 mt-1">La contraseña es obligatoria.</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <svg class="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm text-red-600">{{ errorMessage() }}</p>
              </div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700
                     active:scale-[0.98] text-white font-semibold text-sm
                     transition-all duration-200 shadow-md shadow-indigo-200
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                     focus:outline-none focus:ring-4 focus:ring-indigo-200 mt-2">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              } @else {
                Ingresar
              }
            </button>

          </form>

          <p class="text-center text-sm text-slate-500 mt-6">
            ¿No tenés cuenta?
            <a routerLink="/auth/register" class="font-medium text-indigo-600 hover:text-indigo-800 transition-colors ml-1">
              Registrá tu empresa
            </a>
          </p>
        </div>

      </div>
    </div>
  `
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading      = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/productos']),
      error: (err) => {
        this.errorMessage.set(
          err?.error?.detail ?? 'Email o contraseña incorrectos.'
        );
        this.loading.set(false);
      }
    });
  }
}
