import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-line/70 bg-panel/80 p-6 shadow-panel backdrop-blur-sm transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[24px] before:border before:border-white/5 before:opacity-0 before:transition before:duration-300 hover:border-white/10 hover:before:opacity-100',
        className,
      )}
      {...props}
    />
  );
}
