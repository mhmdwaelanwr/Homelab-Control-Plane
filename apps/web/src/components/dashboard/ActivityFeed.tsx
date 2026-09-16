import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/types/api';

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <Card className="premium-card h-full p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Ops Activity</h3>
          <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Event Feed</p>
        </div>
      </div>

      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-2xl border border-white/8 bg-white/[0.04] p-4 hover:border-brand/25">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant={item.level === 'info' ? 'healthy' : item.level}>{item.source}</Badge>
                <span className="text-[10px] font-mono text-[rgb(var(--color-text-muted))]">{formatRelativeTime(item.timestamp)}</span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.message}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text-muted))]">No recent events</p>
          </div>
        )}
      </div>
    </Card>
  );
}
