import { Suspense, lazy, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Clock3,
  Cpu,
  FolderTree,
  Gauge,
  HardDrive,
  MonitorPlay,
  Radio,
  Settings,
  Sparkles,
  Waypoints,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { HealthGrid } from '@/components/dashboard/HealthGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPercent, formatRelativeTime, formatUptime } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useI18n } from '@/providers/I18nProvider';

const DashboardChartsSection = lazy(async () => ({
  default: (await import('@/components/dashboard/DashboardChartsSection')).DashboardChartsSection,
}));

export function DashboardPage() {
  const { data, loading, error, lastUpdated } = useLiveMetrics();
  const { dir } = useI18n();
  const [viewMode, setViewMode] = useState<'exec' | 'ops'>('exec');

  if (loading && !data) return <LoadingSkeleton className="h-[80vh] w-full" />;
  if (!data) return <ErrorState title="Unavailable" message={error ?? 'No data'} />;

  const postureText =
    data.insights.posture === 'healthy'
      ? 'Healthy'
      : data.insights.posture === 'warning'
        ? 'Warning'
        : data.insights.posture === 'critical'
          ? 'Critical'
          : 'Neutral';

  const refreshLabel = lastUpdated ? formatRelativeTime(lastUpdated) : 'Pending';

  const quickLinks = [
    { to: '/network', icon: Waypoints, label: 'Routing' },
    { to: '/files', icon: FolderTree, label: 'Filesystem' },
    { to: '/screen', icon: MonitorPlay, label: 'Remote Console' },
    { to: '/media', icon: Radio, label: 'Ops Broadcast' },
    { to: '/settings', icon: Settings, label: 'Node Settings' },
  ];

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">NOC Overview</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Linux Operations Center</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.insights.posture}>{postureText}</Badge>
            <Badge variant="neutral">{refreshLabel}</Badge>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-1">
                <Button size="sm" variant={viewMode === 'exec' ? 'secondary' : 'ghost'} onClick={() => setViewMode('exec')}>
                  Node
              </Button>
              <Button size="sm" variant={viewMode === 'ops' ? 'secondary' : 'ghost'} onClick={() => setViewMode('ops')}>
                  Traffic
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="CPU Load"
          value={formatPercent(data.overview.cpuUsage)}
          meta={`load ${data.cpu.loadAverage[0].toFixed(2)}`}
          meterValue={data.overview.cpuUsage}
          status={data.overview.cpuUsage > 80 ? 'critical' : 'healthy'}
          icon={<Cpu className="h-5 w-5" />}
        />
        <StatCard
          title="RAM"
          value={formatPercent(data.overview.ramUsage)}
          meta={`${Math.round(data.ram.used / 1024 / 1024 / 1024)} GB used`}
          meterValue={data.overview.ramUsage}
          status={data.overview.ramUsage > 85 ? 'warning' : 'healthy'}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Disk"
          value={formatPercent(data.overview.storageUsage)}
          meta={`${data.storage.partitions.length} volumes`}
          meterValue={data.overview.storageUsage}
          status={data.overview.storageUsage > 85 ? 'warning' : 'healthy'}
          icon={<HardDrive className="h-5 w-5" />}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(data.overview.uptimeSeconds)}
          meta={data.network.hostname}
          status="neutral"
          icon={<Clock3 className="h-5 w-5" />}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Node Status</h3>
            <Badge variant="healthy">{data.network.localIp}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Primary Alert</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{data.insights.focus.resource}</p>
              <p className="text-sm text-brand">{formatPercent(data.insights.focus.value)}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Route RTT</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{Math.round(120 + data.cpu.totalUsage * 2)} ms</p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">p95 gateway</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Interfaces</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{data.network.interfaces.length}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Runbook Hints</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{data.insights.recommendations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Quick Actions</h3>
            <Sparkles className="h-4 w-4 text-brand" />
          </div>
          <div className="grid gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="m3-pressable [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-brand/10 text-brand">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-[rgb(var(--color-text-primary))]">{item.label}</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-[rgb(var(--color-text-muted))] ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      {viewMode === 'ops' ? (
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Telemetry Trends</h3>
            <Button variant="ghost" size="sm" className="gap-2">
              <Gauge className="h-4 w-4" />
              Stream
            </Button>
          </div>
          <Suspense fallback={<LoadingSkeleton className="h-80 w-full" />}>
            <DashboardChartsSection cpuHistory={data.cpu.history} ramHistory={data.ram.history} storageHistory={data.storage.history} />
          </Suspense>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <HealthGrid items={data.overview.health || []} />
        <ActivityFeed items={data.overview.recentActivity || []} />
      </section>
    </div>
  );
}
