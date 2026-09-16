import { Activity, Database } from 'lucide-react';

import { MetricAreaChart } from '@/components/dashboard/MetricAreaChart';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatBytes, formatPercent } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';

function pressureState(value: number) {
  if (value >= 88) return 'critical';
  if (value >= 70) return 'warning';
  return 'healthy';
}

export function RamPage() {
  const { data, loading, error, connected } = useLiveMetrics();

  if (loading && !data) return <LoadingSkeleton className="h-[60vh] w-full" />;
  if (!data) return <ErrorState title="Memory unavailable" message={error ?? 'No data'} />;

  const state = pressureState(data.ram.usagePercent);
  const swapUsagePercent =
    data.ram.swap.total && data.ram.swap.used ? (data.ram.swap.used / data.ram.swap.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Linux Memory</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">RAM and Swap</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'healthy' : 'warning'}>{connected ? 'Live' : 'Polling'}</Badge>
            <Badge variant={state}>{formatPercent(data.ram.usagePercent)}</Badge>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Memory Pressure</h3>
            <Activity className="h-4 w-4 text-brand" />
          </div>
          <MetricAreaChart title="" subtitle="" points={data.ram.history} color="var(--color-brand)" />
        </Card>

        <Card className="premium-card p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Used</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">{formatBytes(data.ram.used)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Free</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">{formatBytes(data.ram.free)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Page Cache + Buffers</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">{formatBytes((data.ram.cache || 0) + (data.ram.buffers || 0))}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Swap Usage</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">
                {data.ram.swap.total ? formatPercent(swapUsagePercent) : 'Off'}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="premium-card p-5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-brand" />
          <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Total Allocatable RAM: {formatBytes(data.ram.total)}</p>
        </div>
      </Card>
    </div>
  );
}
