import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('adminPassword');
  const confirm  = control.get('confirmarPassword');
  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-tenant',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900
                flex items-center justify-center p-4">

      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                      bg-indigo-600 shadow-lg shadow-indigo-900/50 mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight">JujuyERP</h1>
          <p class="text-slate-400 text-sm mt-1">Registrá tu comercio y comenzá ahora</p>
        </div>

        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          <h2 class="text-lg font-bold text-white mb-6">Crear cuenta gratuita</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Nombre del Comercio *
              </label>
              <input type="text" formControlName="nombreComercio"
                     placeholder="Ej: Almacén El Sol"
                     [class]="inputClass('nombreComercio')" />
              @if (invalid('nombreComercio')) {
                <p class="text-xs text-red-400">El nombre del comercio es obligatorio.</p>
              }
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Email del Administrador *
              </label>
              <input type="email" formControlName="adminEmail"
                     placeholder="admin@micomercio.com"
                     [class]="inputClass('adminEmail')" />
              @if (invalid('adminEmail')) {
                <p class="text-xs text-red-400">Ingresá un email válido.</p>
              }
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Contraseña *
              </label>
              <input type="password" formControlName="adminPassword"
                     placeholder="Mínimo 6 caracteres"
                     [class]="inputClass('adminPassword')" />
              @if (invalid('adminPassword')) {
                <p class="text-xs text-red-400">La contraseña debe tener al menos 6 caracteres.</p>
              }
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Confirmar Contraseña *
              </label>
              <input type="password" formControlName="confirmarPassword"
                     placeholder="Repetí la contraseña"
                     [class]="inputClass('confirmarPassword')" />
              @if (form.hasError('passwordsMismatch') && form.get('confirmarPassword')?.touched) {
                <p class="text-xs text-red-400">Las contraseñas no coinciden.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-sm text-red-400">{{ errorMsg() }}</p>
              </div>
            }

            <button type="submit" [disabled]="cargando()"
              class="w-full py-3 rounded-xl font-bold text-sm text-white
                     bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]
                     shadow-lg shadow-indigo-900/50 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              @if (cargando()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creando cuenta...
                </span>
              } @else {
                Crear mi cuenta →
              }
            </button>

          </form>

          <p class="text-center text-sm text-slate-500 mt-6">
            ¿Ya tenés cuenta?
            <a routerLink="/auth/login"
               class="text-indigo-400 hover:text-indigo-300 font-medium ml-1 transition-colors">
              Iniciar sesión
            </a>
          </p>

        </div>
      </div>
    </div>
  `
})
export class RegisterTenantComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  errorMsg = signal('');

  form = this.fb.nonNullable.group({
    nombreComercio:   ['', Validators.required],
    adminEmail:       ['', [Validators.required, Validators.email]],
    adminPassword:    ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMsg.set('');

    const { nombreComercio, adminEmail, adminPassword } = this.form.getRawValue();

    this.auth.registerComercio(nombreComercio, adminEmail, adminPassword).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: '1' }
        });
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.detail ?? 'No se pudo crear la cuenta. Intentá de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  inputClass(field: string): string {
    const ctrl = this.form.get(field);
    const err  = ctrl?.invalid && ctrl?.touched;
    return `w-full px-4 py-2.5 rounded-xl border text-sm text-white
            bg-white/5 placeholder-slate-600 outline-none transition-all
            focus:ring-4
            ${err
              ? 'border-red-500/50 ring-red-500/10 focus:border-red-400'
              : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'}`;
  }

  invalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
