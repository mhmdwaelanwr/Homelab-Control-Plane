import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'icon';
};

const styles = {
  primary:
    '[--state-layer-color:rgb(10_18_30)] bg-brand text-slate-950 shadow-[0_16px_30px_rgba(var(--color-brand-rgb),0.22)]',
  secondary:
    '[--state-layer-color:rgb(var(--color-text-primary))] border border-line/50 bg-white/[0.05] text-[rgb(var(--color-text-primary))]',
  ghost: '[--state-layer-color:rgb(var(--color-text-primary))] bg-transparent text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]',
  danger: '[--state-layer-color:rgb(255_255_255)] bg-danger text-white',
};

const sizes = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-12 px-4 text-sm',
  icon: 'h-10 w-10 p-0',
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'm3-pressable inline-flex items-center justify-center gap-2 rounded-[12px] border border-transparent font-semibold disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
