import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const variants = {
  healthy: 'status-badge-healthy',
  warning: 'status-badge-warning',
  critical: 'status-badge-critical',
  neutral: 'status-badge-neutral',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
