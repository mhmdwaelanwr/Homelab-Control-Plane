import { Cpu, Flame, Gauge } from 'lucide-react';

import { MetricAreaChart } from '@/components/dashboard/MetricAreaChart';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPercent } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';

function pressureState(value: number) {
  if (value >= 85) return 'critical';
  if (value >= 65) return 'warning';
  return 'healthy';
}

export function CpuPage() {
  const { data, loading, error, connected } = useLiveMetrics();

  if (loading && !data) return <LoadingSkeleton className="h-[60vh] w-full" />;
  if (!data) return <ErrorState title="CPU unavailable" message={error ?? 'No data'} />;

  const hottestCore = data.cpu.perCore.reduce(
    (current, value, index) => (value > current.value ? { index, value } : current),
    { index: 0, value: data.cpu.perCore[0] ?? 0 },
  );

  const status = pressureState(data.cpu.totalUsage);

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Linux CPU</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Compute Monitor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'healthy' : 'warning'}>{connected ? 'Live' : 'Polling'}</Badge>
            <Badge variant={status}>{formatPercent(data.cpu.totalUsage)}</Badge>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Utilization</h3>
            <Gauge className="h-4 w-4 text-brand" />
          </div>
          <MetricAreaChart title="" subtitle="" points={data.cpu.history} color="var(--color-brand)" />
        </Card>

        <Card className="premium-card p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Peak Thread</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">#{hottestCore.index}</p>
              <p className="text-sm text-brand">{formatPercent(hottestCore.value)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Load Average</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">{data.cpu.loadAverage[0].toFixed(2)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">CPU Temp</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">
                {data.cpu.temperatureC != null ? `${data.cpu.temperatureC} C` : 'N/A'}
              </p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Clock</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--color-text-primary))]">
                {data.cpu.frequencyMHz != null ? `${Math.round(data.cpu.frequencyMHz)} MHz` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.cpu.perCore.slice(0, 8).map((usage, index) => (
          <Card key={index} className="premium-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[rgb(var(--color-text-secondary))]">Core {index}</p>
              <Flame className="h-4 w-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-[rgb(var(--color-text-primary))]">{formatPercent(usage)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full bg-brand" style={{ width: `${usage}%` }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
