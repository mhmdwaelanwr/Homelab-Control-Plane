import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, HardDrive, Lightbulb, Network, ShieldCheck, Sparkles, Timer } from 'lucide-react';

import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPercent } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { fetchConnectedDevices, fetchServicesHealth } from '@/services/system';

function computeMaturityScore(args: {
  cpu: number;
  ram: number;
  storage: number;
  devices: number;
  serviceWarning: number;
  serviceCritical: number;
}) {
  let score = 100;

  score -= Math.max(0, args.cpu - 60) * 0.5;
  score -= Math.max(0, args.ram - 65) * 0.55;
  score -= Math.max(0, args.storage - 70) * 0.6;

  if (args.devices < 3) {
    score -= 10;
  }

  score -= args.serviceWarning * 3;
  score -= args.serviceCritical * 8;

  return Math.max(20, Math.min(100, Math.round(score)));
}

function maturityTier(score: number) {
  if (score >= 85) {
    return { label: 'Advanced Homelab', tone: 'healthy' as const };
  }

  if (score >= 65) {
    return { label: 'Growing Homelab', tone: 'warning' as const };
  }

  return { label: 'Starter Homelab', tone: 'critical' as const };
}

export function HomelabIntelligencePage() {
  const { data, loading, error } = useLiveMetrics();
  const devicesQuery = useQuery({
    queryKey: ['system', 'devices', 'homelab'],
    queryFn: fetchConnectedDevices,
    staleTime: 30_000,
  });

  const servicesQuery = useQuery({
    queryKey: ['system', 'services-health'],
    queryFn: fetchServicesHealth,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  if (loading && !data) {
    return <LoadingSkeleton className="h-[70vh] w-full" />;
  }

  if (!data) {
    return <ErrorState title="Homelab unavailable" message={error ?? 'No telemetry available'} />;
  }

  const devicesCount = devicesQuery.data?.devices.length ?? 0;
  const servicesSummary = servicesQuery.data?.summary ?? { healthy: 0, warning: 0, critical: 0 };

  const score = useMemo(
    () =>
      computeMaturityScore({
        cpu: data.overview.cpuUsage,
        ram: data.overview.ramUsage,
        storage: data.overview.storageUsage,
        devices: devicesCount,
        serviceWarning: servicesSummary.warning,
        serviceCritical: servicesSummary.critical,
      }),
    [data.overview.cpuUsage, data.overview.ramUsage, data.overview.storageUsage, devicesCount, servicesSummary.warning, servicesSummary.critical],
  );

  const tier = maturityTier(score);

  const priorities = [
    {
      title: 'Automation Backbone',
      description: 'Build backup + update automation jobs (cron, Ansible, or simple runbooks) to cut manual drift.',
      icon: Sparkles,
    },
    {
      title: 'Network Segmentation',
      description: 'Separate management, media, and IoT traffic using VLANs and firewall rules for safer blast radius.',
      icon: Network,
    },
    {
      title: 'Security Hardening',
      description: 'Enable MFA, rotate tokens, and isolate exposed services behind reverse proxy + access controls.',
      icon: ShieldCheck,
    },
  ];

  const homelabStack = [
    'Core: Docker + reverse proxy + DNS + backup repository',
    'Observability: node metrics + uptime checks + alert routing',
    'Platform: media, files, terminal, and remote desktop services',
  ];

  return (
    <div className="space-y-6">
      <Card className="premium-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Strategy Layer</p>
            <h1 className="mt-2 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Homelab Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--color-text-secondary))]">
              A practical maturity lens for turning this dashboard into a serious home datacenter control plane.
            </p>
          </div>
          <Badge variant={tier.tone}>{tier.label}</Badge>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="premium-card p-5">
          <p className="text-xs text-[rgb(var(--color-text-muted))]">Maturity Score</p>
          <p className="mt-2 text-3xl font-bold text-[rgb(var(--color-text-primary))]">{score}/100</p>
        </Card>

        <Card className="premium-card p-5">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-secondary))]">
            <Cpu className="h-4 w-4" />
            <p className="text-xs">CPU Pressure</p>
          </div>
          <p className="mt-2 text-xl font-semibold text-[rgb(var(--color-text-primary))]">{formatPercent(data.overview.cpuUsage)}</p>
        </Card>

        <Card className="premium-card p-5">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-secondary))]">
            <HardDrive className="h-4 w-4" />
            <p className="text-xs">Storage Usage</p>
          </div>
          <p className="mt-2 text-xl font-semibold text-[rgb(var(--color-text-primary))]">{formatPercent(data.overview.storageUsage)}</p>
        </Card>

        <Card className="premium-card p-5">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-secondary))]">
            <Network className="h-4 w-4" />
            <p className="text-xs">Detected Devices</p>
          </div>
          <p className="mt-2 text-xl font-semibold text-[rgb(var(--color-text-primary))]">{devicesCount}</p>
        </Card>
      </section>

      <Card className="premium-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Service Health Probes</h2>
            <p className="text-xs text-[rgb(var(--color-text-muted))]">Live checks for common homelab services.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="healthy">Healthy {servicesSummary.healthy}</Badge>
            <Badge variant="warning">Warning {servicesSummary.warning}</Badge>
            <Badge variant="critical">Critical {servicesSummary.critical}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(servicesQuery.data?.services ?? []).map((service) => (
            <div key={service.id} className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[rgb(var(--color-text-primary))]">{service.name}</p>
                <Badge variant={service.status}>{service.status}</Badge>
              </div>
              <p className="mt-2 truncate text-xs text-[rgb(var(--color-text-muted))]">{service.url}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                <Timer className="h-3.5 w-3.5" />
                <span>{service.latencyMs} ms</span>
                <span>•</span>
                <span>{service.httpStatus ?? 'no-code'}</span>
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--color-text-secondary))]">{service.message}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-brand" />
            <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Next 30 Days Priorities</h2>
          </div>
          <div className="space-y-3">
            {priorities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand" />
                    <p className="font-semibold text-[rgb(var(--color-text-primary))]">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-secondary))]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="premium-card p-6">
          <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Recommended Homelab Stack</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[rgb(var(--color-text-secondary))]">
            {homelabStack.map((line) => (
              <li key={line} className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
