import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DialogProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
}>;

export function Dialog({ open, title, description, footer, onClose, children }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cn('premium-card relative z-10 w-full max-w-lg rounded-[24px] p-6 shadow-panel')}>
        <div className="mb-4 space-y-1">
          <h3 className="font-display text-xl text-[rgb(var(--color-text-primary))]">{title}</h3>
          {description ? <p className="text-sm text-[rgb(var(--color-text-secondary))]">{description}</p> : null}
        </div>
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-4">{footer}</div> : null}
      </div>
    </div>
  );
}
