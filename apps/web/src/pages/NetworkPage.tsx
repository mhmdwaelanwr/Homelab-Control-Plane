import { useQuery } from '@tanstack/react-query';
import { Copy, RefreshCw, Server, Waypoints, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { copyToClipboard } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useToast } from '@/providers/ToastProvider';
import { fetchConnectedDevices, fetchNetwork } from '@/services/system';

function classify(address: string): 'healthy' | 'warning' | 'neutral' {
  if (address.startsWith('10.') || address.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    return 'healthy';
  }
  if (address.startsWith('127.') || address.startsWith('169.254.')) {
    return 'neutral';
  }
  return 'warning';
}

export function NetworkPage() {
  const { pushToast } = useToast();
  const { data: liveMetrics, connected } = useLiveMetrics();
  const query = useQuery({ queryKey: ['network-overview'], queryFn: fetchNetwork });
  const devicesQuery = useQuery({ queryKey: ['network-devices'], queryFn: fetchConnectedDevices, refetchInterval: 15000 });
  const [networkTab, setNetworkTab] = useState<'devices' | 'topology'>('devices');
  const network = query.data ?? liveMetrics?.network ?? null;
  const topologyNodes = useMemo(() => {
    const nodes = [network?.localIp ?? '127.0.0.1', ...(devicesQuery.data?.devices.map((device) => device.ip) ?? [])];
    return nodes.slice(0, 12);
  }, [devicesQuery.data?.devices, network?.localIp]);

  async function onCopy(label: string, value: string | undefined) {
    if (!value) return;
    await copyToClipboard(value);
    pushToast({ title: `${label} copied`, description: value, variant: 'success' });
  }

  if (query.isLoading && !network) return <LoadingSkeleton className="h-[70vh] w-full" />;
  if (!network) return <ErrorState title="Network unavailable" message={(query.error as Error | undefined)?.message ?? 'No data'} onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">CCNA Network</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Interface and Route Map</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'healthy' : 'warning'}>{connected ? 'Live' : 'Snapshot'}</Badge>
            <Badge variant="neutral">{network.interfaces.length} interfaces up</Badge>
            <Button variant="ghost" size="icon" onClick={() => void query.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge variant="neutral">{devicesQuery.data?.devices.length ?? 0} neighbors</Badge>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Hostname</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{network.hostname}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">User</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{network.currentUser}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Primary IPv4</p>
              <p className="mt-1 text-lg font-bold text-[rgb(var(--color-text-primary))]">{network.localIp}</p>
            </div>
          </div>

          <div className="space-y-3">
            {network.interfaces.map((entry) => (
              <div key={`${entry.name}-${entry.address}`} className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Waypoints className="h-4 w-4 text-brand" />
                    <p className="font-semibold text-[rgb(var(--color-text-primary))]">{entry.name}</p>
                  </div>
                  <Badge variant={classify(entry.address)}>{entry.address}</Badge>
                </div>
                <div className="mt-2">
                    <Button variant="ghost" size="sm" onClick={() => void onCopy('Interface Address', entry.address)}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="space-y-3">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-brand" />
                <p className="font-semibold text-[rgb(var(--color-text-primary))]">Default Route Path</p>
              </div>
              <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">{network.localIp}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-brand" />
                <p className="font-semibold text-[rgb(var(--color-text-primary))]">Linux Hostname</p>
              </div>
              <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">{network.hostname}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="premium-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">أجهزة الشبكة والـ Topology</h3>
          <div className="flex items-center gap-2">
            <div className="rounded-[10px] border border-white/10 bg-white/[0.04] p-1">
              <Button size="sm" variant={networkTab === 'devices' ? 'secondary' : 'ghost'} onClick={() => setNetworkTab('devices')}>
                Devices
              </Button>
              <Button size="sm" variant={networkTab === 'topology' ? 'secondary' : 'ghost'} onClick={() => setNetworkTab('topology')}>
                Topology
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void devicesQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        </div>

        {devicesQuery.isLoading ? <LoadingSkeleton className="h-32 w-full" /> : null}
        {devicesQuery.isError ? <ErrorState title="Neighbor scan unavailable" message={(devicesQuery.error as Error).message} /> : null}

        {!devicesQuery.isLoading && !devicesQuery.isError && networkTab === 'devices' ? (
          devicesQuery.data?.devices.length ? (
            <div className="overflow-x-auto rounded-[14px] border border-white/10">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-white/[0.04] text-[rgb(var(--color-text-muted))]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">IP</th>
                    <th className="px-4 py-3 font-semibold">MAC</th>
                    <th className="px-4 py-3 font-semibold">Interface</th>
                    <th className="px-4 py-3 font-semibold">State</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {devicesQuery.data.devices.map((device) => (
                    <tr key={`${device.ip}-${device.mac ?? 'na'}-${device.iface ?? 'na'}`} className="border-t border-white/8">
                      <td className="px-4 py-3 font-mono text-[rgb(var(--color-text-primary))]">{device.ip}</td>
                      <td className="px-4 py-3 font-mono text-[rgb(var(--color-text-secondary))]">{device.mac ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-[rgb(var(--color-text-secondary))]">{device.iface ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-[rgb(var(--color-text-secondary))]">{device.state ?? 'unknown'}</td>
                      <td className="px-4 py-3 text-[rgb(var(--color-text-secondary))]">{device.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-white/10 p-5 text-sm text-[rgb(var(--color-text-secondary))]">
              لا توجد أجهزة متصلة حالياً. أعيدي الفحص بعد مرور حركة على الواجهات.
            </div>
          )
        ) : null}

        {!devicesQuery.isLoading && !devicesQuery.isError && networkTab === 'topology' ? (
          <div className="rounded-[14px] border border-white/10 bg-slate-950/35 p-4">
            <svg viewBox="0 0 900 320" className="h-[320px] w-full">
              {topologyNodes.slice(1).map((node, index) => {
                const angle = (index / Math.max(topologyNodes.length - 1, 1)) * Math.PI * 2;
                const x = 450 + Math.cos(angle) * 260;
                const y = 160 + Math.sin(angle) * 120;
                return (
                  <g key={`edge-${node}`}>
                    <line x1={450} y1={160} x2={x} y2={y} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                    <circle cx={x} cy={y} r={19} fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.9)" strokeWidth="1.5" />
                    <text x={x} y={y + 4} textAnchor="middle" className="fill-slate-100 text-[9px] font-bold">N</text>
                    <text x={x} y={y + 32} textAnchor="middle" className="fill-slate-300 text-[10px] font-mono">{node}</text>
                  </g>
                );
              })}

              <circle cx={450} cy={160} r={28} fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.95)" strokeWidth="2" />
              <text x={450} y={165} textAnchor="middle" className="fill-slate-50 text-[10px] font-bold">HOST</text>
              <text x={450} y={205} textAnchor="middle" className="fill-slate-200 text-[11px] font-mono">{network.localIp}</text>
            </svg>
            <p className="mt-3 text-xs text-[rgb(var(--color-text-secondary))]">
              عرض Topology مبسط يوضح علاقات المضيف مع الأجهزة المكتشفة من ARP/Neighbors.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
