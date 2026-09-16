import { cn } from '@/lib/utils';

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-white/6', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-info transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
