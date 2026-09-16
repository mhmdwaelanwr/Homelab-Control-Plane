import { Folder, HardDrive } from 'lucide-react';

import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatBytes, formatPercent } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';

export function StoragePage() {
  const { data, loading, error, connected } = useLiveMetrics();

  if (loading && !data) return <LoadingSkeleton className="h-[60vh] w-full" />;
  if (!data) return <ErrorState title="Storage unavailable" message={error ?? 'No data'} />;

  const usage = data.storage.total > 0 ? (data.storage.used / data.storage.total) * 100 : 0;
  const status = usage > 90 ? 'critical' : usage > 75 ? 'warning' : 'healthy';

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Linux Storage</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Filesystem Capacity</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'healthy' : 'warning'}>{connected ? 'Live' : 'Cached'}</Badge>
            <Badge variant={status}>{formatPercent(usage)}</Badge>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand/10 text-brand">
              <HardDrive className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Disk Utilization</h3>
          </div>

          <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/6 p-[2px]">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-info" style={{ width: `${usage}%` }} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Used</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{formatBytes(data.storage.used)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Free</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{formatBytes(data.storage.free)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Mounted Volumes</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{data.storage.partitions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <h3 className="mb-4 text-lg font-bold text-[rgb(var(--color-text-primary))]">Mount Points</h3>
          <div className="space-y-3">
            {data.storage.partitions.slice(0, 6).map((partition) => (
              <div key={`${partition.name}-${partition.mountPoint}`} className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-semibold text-[rgb(var(--color-text-primary))]">{partition.mountPoint}</p>
                  <Badge variant={partition.usagePercent > 90 ? 'critical' : partition.usagePercent > 75 ? 'warning' : 'healthy'}>
                    {formatPercent(partition.usagePercent)}
                  </Badge>
                </div>
                <p className="text-xs text-[rgb(var(--color-text-secondary))]">{partition.filesystem} • {formatBytes(partition.total)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="premium-card p-5">
        <div className="flex items-center gap-2 text-[rgb(var(--color-text-secondary))]">
          <Folder className="h-4 w-4" />
          <span className="text-sm font-semibold">Filesystem checks nominal</span>
        </div>
      </Card>
    </div>
  );
}
