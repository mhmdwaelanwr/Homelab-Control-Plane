import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
};

type ToasterProps = {
  toasts: ToastItem[];
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

const tones = {
  info: 'border-info/30',
  success: 'border-accent/30',
  warning: 'border-warning/30',
  danger: 'border-danger/30',
};

export function Toaster({ toasts }: ToasterProps) {
  const { dir } = useI18n();

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-4 z-[60] flex w-[min(100vw-1rem,24rem)] flex-col gap-3 sm:w-full sm:max-w-sm',
        dir === 'rtl' ? 'left-4' : 'right-4',
      )}
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.variant ?? 'info'];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto rounded-2xl border bg-panel px-4 py-3 shadow-panel backdrop-blur-sm',
              tones[toast.variant ?? 'info'],
            )}
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description ? <p className="text-sm text-slate-400">{toast.description}</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
