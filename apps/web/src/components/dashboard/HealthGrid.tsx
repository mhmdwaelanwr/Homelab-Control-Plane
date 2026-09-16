import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { HealthIndicator } from '@/types/api';

type HealthGridProps = {
  items: HealthIndicator[];
};

export function HealthGrid({ items = [] }: HealthGridProps) {
  return (
    <Card className="premium-card p-8">
      <div className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">NOC Health</h3>
        <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Service Status</p>
      </div>
      <div className="grid gap-4">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item.label} className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-bold text-[rgb(var(--color-text-primary))]">{item.label}</h4>
                <Badge variant={item.status}>{item.status}</Badge>
              </div>
              <p className="text-[11px] font-medium text-[rgb(var(--color-text-secondary))]">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
            <p className="text-xs text-[rgb(var(--color-text-muted))]">No health telemetry</p>
          </div>
        )}
      </div>
    </Card>
  );
}
