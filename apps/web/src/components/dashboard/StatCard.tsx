import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  meta: string;
  detail?: string;
  meterValue?: number;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  icon?: ReactNode;
};

export function StatCard({ title, value, meta, detail, meterValue, status = 'neutral', icon }: StatCardProps) {
  const getStatusColor = () => {
    switch(status) {
      case 'healthy': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'critical': return 'bg-danger';
      default: return 'bg-[rgb(var(--color-text-muted))]';
    }
  };

  return (
    <Card className="premium-card group overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand/8 blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:bg-brand/20" />

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="stat-value text-4xl tracking-tighter">{value}</h2>
            <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', getStatusColor())} />
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.05] text-brand shadow-inner transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>

      <div className="relative z-10 mt-6">
         <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[rgb(var(--color-text-secondary))]">
            <span>{meta}</span>
            {typeof meterValue === 'number' && <span className="font-mono text-brand">{Math.round(meterValue)}%</span>}
         </div>
         
         {typeof meterValue === 'number' && (
           <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/6 bg-black/15 p-[1px]">
             <div 
               className="h-full rounded-full bg-gradient-to-r from-brand to-info transition-all duration-1000 ease-out" 
               style={{ width: `${meterValue}%` }} 
             />
           </div>
         )}
      </div>

      {detail && (
        <div className="relative z-10 mt-5 border-t border-white/6 pt-4">
          <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-widest leading-relaxed text-[rgb(var(--color-text-muted))]">
            {detail}
          </p>
        </div>
      )}
    </Card>
  );
}
