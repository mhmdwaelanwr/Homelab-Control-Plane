import { cn } from '@/lib/utils';

type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/6', className)} />;
}
