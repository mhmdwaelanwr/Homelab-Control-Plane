import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'm3-field h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none placeholder:text-[rgb(var(--color-text-muted))] focus:bg-panelAlt/72',
        className,
      )}
      {...props}
    />
  );
}
