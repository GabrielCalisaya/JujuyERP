import { Component, inject } from '@angular/core';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service';

interface ToastConfig {
  bar:   string;
  icon:  string;
  label: string;
  path:  string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 pointer-events-none"
         style="min-width:300px;max-width:380px">
      @for (toast of svc.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl
                    bg-neutral-900/90 backdrop-blur-xl border shadow-2xl overflow-hidden relative"
             [class]="borderClass(toast.type)"
             style="animation:toastIn .22s cubic-bezier(.16,1,.3,1) both">

          <div class="w-7 h-7 shrink-0 mt-0.5 rounded-lg flex items-center justify-center"
               [class]="iconBg(toast.type)">
            <svg class="w-3.5 h-3.5" [class]="iconColor(toast.type)"
                 fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="iconPath(toast.type)"/>
            </svg>
          </div>

          <p class="flex-1 text-[13px] font-medium text-neutral-200 leading-snug pt-0.5">
            {{ toast.message }}
          </p>

          <button (click)="svc.dismiss(toast.id)"
            class="w-5 h-5 flex items-center justify-center rounded-md mt-0.5 shrink-0
                   text-neutral-600 hover:text-neutral-300 transition-colors duration-150">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div class="absolute bottom-0 left-0 right-0 h-[2px] origin-left rounded-full"
               [class]="barClass(toast.type)"
               style="animation:toastBar 3s linear forwards"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toastIn {
      from { opacity:0; transform:translateX(14px) scale(0.97); }
      to   { opacity:1; transform:translateX(0)    scale(1);    }
    }
    @keyframes toastBar {
      from { transform:scaleX(1); }
      to   { transform:scaleX(0); }
    }
  `]
})
export class ToastComponent {
  readonly svc = inject(ToastService);

  borderClass(t: ToastType): string {
    return ({
      success: 'border-emerald-500/25',
      error:   'border-red-500/25',
      warning: 'border-amber-500/25',
      info:    'border-indigo-500/25',
    } as Record<ToastType,string>)[t];
  }

  iconBg(t: ToastType): string {
    return ({
      success: 'bg-emerald-500/[0.1]',
      error:   'bg-red-500/[0.1]',
      warning: 'bg-amber-500/[0.1]',
      info:    'bg-indigo-500/[0.1]',
    } as Record<ToastType,string>)[t];
  }

  iconColor(t: ToastType): string {
    return ({
      success: 'text-emerald-400',
      error:   'text-red-400',
      warning: 'text-amber-400',
      info:    'text-indigo-400',
    } as Record<ToastType,string>)[t];
  }

  iconPath(t: ToastType): string {
    return ({
      success: 'M5 13l4 4L19 7',
      error:   'M6 18L18 6M6 6l12 12',
      warning: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    } as Record<ToastType,string>)[t];
  }

  barClass(t: ToastType): string {
    return ({
      success: 'bg-emerald-500/50',
      error:   'bg-red-500/50',
      warning: 'bg-amber-500/50',
      info:    'bg-indigo-500/50',
    } as Record<ToastType,string>)[t];
  }
}
