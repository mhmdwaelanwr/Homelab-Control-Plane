import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, MonitorCog, RefreshCw, ShieldCheck, Signal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  connectScreen,
  controlScreenShareLink,
  createScreenShareLink,
  deleteScreenShareLink,
  getScreenAudit,
  disconnectScreen,
  getScreenShareLinks,
  getScreenStatus,
  reconnectScreen,
  setScreenQuality,
} from '@/services/screen';
import { fetchConnectedDevices } from '@/services/system';
import { copyToClipboard, formatTimestamp } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';

function stateVariant(state: string | undefined) {
  if (state === 'connected') return 'healthy';
  if (state === 'failed') return 'critical';
  if (state === 'reconnecting' || state === 'connecting') return 'warning';
  return 'neutral';
}

export function ScreenSharePage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const [sourceDevice, setSourceDevice] = useState('');
  const [targetDevice, setTargetDevice] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['screen-status'],
    queryFn: getScreenStatus,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === 'connected' || state === 'connecting' || state === 'reconnecting' ? 4000 : false;
    },
  });
  const linksQuery = useQuery({ queryKey: ['screen-links'], queryFn: getScreenShareLinks, refetchInterval: 10000 });
  const devicesQuery = useQuery({ queryKey: ['network-devices'], queryFn: fetchConnectedDevices, refetchInterval: 15000 });
  const auditQuery = useQuery({ queryKey: ['screen-audit'], queryFn: getScreenAudit, refetchInterval: 10000 });

  const connectMutation = useMutation({
    mutationFn: connectScreen,
    onSuccess: async (status) => {
      queryClient.setQueryData(['screen-status'], status);
      await queryClient.invalidateQueries({ queryKey: ['screen-status'] });
      pushToast({ title: 'Connected', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'Connect failed', description: (error as Error).message, variant: 'danger' }),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectScreen,
    onSuccess: async (status) => {
      queryClient.setQueryData(['screen-status'], status);
      await queryClient.invalidateQueries({ queryKey: ['screen-status'] });
      pushToast({ title: 'Disconnected', variant: 'warning' });
    },
    onError: (error) => pushToast({ title: 'Disconnect failed', description: (error as Error).message, variant: 'danger' }),
  });

  const reconnectMutation = useMutation({
    mutationFn: reconnectScreen,
    onSuccess: async (status) => {
      queryClient.setQueryData(['screen-status'], status);
      await queryClient.invalidateQueries({ queryKey: ['screen-status'] });
      pushToast({ title: 'Reconnected', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'Reconnect failed', description: (error as Error).message, variant: 'danger' }),
  });

  const createLinkMutation = useMutation({
    mutationFn: createScreenShareLink,
    onSuccess: async (snapshot) => {
      queryClient.setQueryData(['screen-links'], snapshot);
      await queryClient.invalidateQueries({ queryKey: ['screen-links'] });
      pushToast({ title: 'تم إنشاء رابط مشاركة الشاشة', variant: 'success' });
      setLinkLabel('');
    },
    onError: (error) => pushToast({ title: 'فشل إنشاء الرابط', description: (error as Error).message, variant: 'danger' }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: deleteScreenShareLink,
    onSuccess: async (snapshot) => {
      queryClient.setQueryData(['screen-links'], snapshot);
      await queryClient.invalidateQueries({ queryKey: ['screen-links'] });
      pushToast({ title: 'تم حذف رابط مشاركة الشاشة', variant: 'warning' });
    },
    onError: (error) => pushToast({ title: 'فشل حذف الرابط', description: (error as Error).message, variant: 'danger' }),
  });

  const controlLinkMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'pause' | 'resume' | 'disconnect' }) =>
      controlScreenShareLink(id, action),
    onSuccess: async (snapshot) => {
      queryClient.setQueryData(['screen-links'], snapshot);
      await queryClient.invalidateQueries({ queryKey: ['screen-links'] });
      pushToast({ title: 'تم تنفيذ أمر التحكم على رابط الشاشة', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'فشل أمر التحكم', description: (error as Error).message, variant: 'danger' }),
  });

  const qualityMutation = useMutation({
    mutationFn: setScreenQuality,
    onSuccess: async (nextStatus) => {
      queryClient.setQueryData(['screen-status'], nextStatus);
      await queryClient.invalidateQueries({ queryKey: ['screen-status'] });
      pushToast({ title: 'تم تحديث جودة البث', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'فشل تحديث الجودة', description: (error as Error).message, variant: 'danger' }),
  });

  const status = statusQuery.data;
  const canControl = user?.role === 'local-admin';
  const busy = connectMutation.isPending || disconnectMutation.isPending || reconnectMutation.isPending;
  const viewerUrl = status?.metadata.viewerUrl ?? status?.embedUrl ?? null;
  const websocketUrl = status?.metadata.websocketUrl ?? null;
  const selectedLink = linksQuery.data?.links.find((item) => item.id === selectedLinkId) ?? linksQuery.data?.links[0] ?? null;
  const targetViewerUrl = selectedLink?.viewerUrl ?? viewerUrl;

  async function onCopy(label: string, value: string | null | undefined) {
    if (!value) return;
    await copyToClipboard(value);
    pushToast({ title: `${label} copied`, description: value, variant: 'success' });
  }

  function openViewer() {
    if (!viewerUrl) {
      pushToast({ title: 'Viewer unavailable', variant: 'warning' });
      return;
    }
    window.open(viewerUrl, '_blank', 'noopener,noreferrer');
  }

  function createLink() {
    if (!sourceDevice.trim() || !targetDevice.trim()) {
      pushToast({ title: 'اختاري جهاز مصدر وهدف', variant: 'warning' });
      return;
    }

    createLinkMutation.mutate({
      sourceDevice: sourceDevice.trim(),
      targetDevice: targetDevice.trim(),
      label: linkLabel.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Remote Console</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Linux Session Tunnel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stateVariant(status?.state)}>{status?.state ?? 'disconnected'}</Badge>
            <Badge variant={canControl ? 'healthy' : 'warning'}>{canControl ? 'صلاحية تحكم كامل' : 'مشاهدة فقط'}</Badge>
            <Button variant="ghost" size="icon" onClick={() => void statusQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {statusQuery.isLoading ? <LoadingSkeleton className="h-40 w-full" /> : null}
      {statusQuery.isError ? <ErrorState title="Screen unavailable" message={(statusQuery.error as Error).message} onRetry={() => void statusQuery.refetch()} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Session ID</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{status?.sessionId ?? 'None'}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Transport</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{status?.transport ?? 'novnc'}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Tunnel Health</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{status?.metadata.connectionHealth ?? 'unknown'}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">Connected At</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{status?.connectedAt ? formatTimestamp(status.connectedAt) : 'Inactive'}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
            {status?.statusMessage ?? 'Ready'}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs text-[rgb(var(--color-text-muted))]">جودة البث</label>
            <select
              value={status?.metadata.streamingQuality ?? 'medium'}
              onChange={(event) => qualityMutation.mutate(event.target.value as 'low' | 'medium' | 'high')}
              className="h-11 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
              disabled={!canControl || qualityMutation.isPending}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button disabled={!canControl || busy || status?.state === 'connected'} onClick={() => connectMutation.mutate()}>
              Start Tunnel
            </Button>
            <Button variant="secondary" disabled={!canControl || busy || status?.state !== 'connected'} onClick={() => disconnectMutation.mutate()}>
              Stop Tunnel
            </Button>
            <Button variant="secondary" disabled={!canControl || busy} onClick={() => reconnectMutation.mutate()}>
              Re-establish
            </Button>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <MonitorCog className="h-4 w-4 text-brand" />
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Console Viewer</h3>
          </div>

          <div className="space-y-3">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">URL</p>
              <p className="mt-1 truncate text-sm font-semibold text-[rgb(var(--color-text-primary))]">{viewerUrl ?? 'Pending'}</p>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] text-[rgb(var(--color-text-muted))]">WebSocket</p>
              <p className="mt-1 truncate text-sm font-semibold text-[rgb(var(--color-text-primary))]">{websocketUrl ?? 'Pending'}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={openViewer} disabled={!viewerUrl}>
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            <Button variant="secondary" onClick={() => void onCopy('Viewer URL', viewerUrl)} disabled={!viewerUrl}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="ghost" onClick={() => void onCopy('Socket URL', websocketUrl)} disabled={!websocketUrl}>
              <Copy className="h-4 w-4" />
              Socket
            </Button>
            <Button variant="ghost" onClick={() => void onCopy('Summary', `State: ${status?.state ?? 'disconnected'}\nViewer: ${viewerUrl ?? 'N/A'}\nSocket: ${websocketUrl ?? 'N/A'}`)}>
              <Copy className="h-4 w-4" />
              Summary
            </Button>
          </div>

          <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand" />
              <span>Managed noVNC tunnel flow</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">شاشة البث (Source)</h3>
            <Badge variant={status?.connected ? 'healthy' : 'warning'}>{status?.connected ? 'Live' : 'Idle'}</Badge>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-white/10 bg-black/40">
            {viewerUrl ? (
              <iframe
                title="Screen Broadcast Source"
                src={viewerUrl}
                className="h-[340px] w-full"
                allow="clipboard-read; clipboard-write; fullscreen"
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center text-sm text-[rgb(var(--color-text-secondary))]">
                ابدأ النفق أولاً لعرض شاشة البث.
              </div>
            )}
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">شاشة العرض (Target)</h3>
            <Badge variant={selectedLink?.status === 'active' ? 'healthy' : 'neutral'}>{selectedLink?.status ?? 'idle'}</Badge>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-white/10 bg-black/40">
            {selectedLink && targetViewerUrl ? (
              <iframe
                title="Screen Broadcast Target"
                src={targetViewerUrl}
                className="h-[340px] w-full"
                allow="clipboard-read; clipboard-write; fullscreen"
              />
            ) : (
              <div className="flex h-[340px] items-center justify-center text-sm text-[rgb(var(--color-text-secondary))]">
                اختَر رابط مشاركة فعّال لعرض شاشة الجهاز الهدف.
              </div>
            )}
          </div>
        </Card>
      </section>

      {!status?.connected && !statusQuery.isLoading && !statusQuery.isError ? (
        <EmptyState title="Tunnel idle" description="Start tunnel to open remote console view." />
      ) : null}

      <Card className="premium-card p-5">
        <div className="flex items-center gap-2 text-[rgb(var(--color-text-secondary))]">
          <Signal className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold">Relay link ready</span>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">مشاركة شاشة بين الأجهزة</h3>
            <Badge variant="neutral">{devicesQuery.data?.devices.length ?? 0} أجهزة</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-[rgb(var(--color-text-muted))]">جهاز المصدر</label>
              <select
                value={sourceDevice}
                onChange={(event) => setSourceDevice(event.target.value)}
                className="h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
              >
                <option value="">اختيار المصدر</option>
                {(devicesQuery.data?.devices ?? []).map((device) => (
                  <option key={`src-${device.ip}-${device.iface ?? 'na'}`} value={device.ip}>
                    {device.ip} {device.iface ? `(${device.iface})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-[rgb(var(--color-text-muted))]">جهاز الهدف</label>
              <select
                value={targetDevice}
                onChange={(event) => setTargetDevice(event.target.value)}
                className="h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
              >
                <option value="">اختيار الهدف</option>
                {(devicesQuery.data?.devices ?? []).map((device) => (
                  <option key={`dst-${device.ip}-${device.iface ?? 'na'}`} value={device.ip}>
                    {device.ip} {device.iface ? `(${device.iface})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-2 block text-xs text-[rgb(var(--color-text-muted))]">الوصف</label>
            <Input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="مثال: Lab-A to Lab-B" />
          </div>

          <div className="mt-4">
            <Button onClick={createLink} disabled={!canControl || createLinkMutation.isPending}>إنشاء رابط مشاركة</Button>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">روابط المشاركة الحالية</h3>
            <Button variant="ghost" size="sm" onClick={() => void linksQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>

          {linksQuery.isLoading ? <LoadingSkeleton className="h-28 w-full" /> : null}
          {linksQuery.isError ? <ErrorState title="تعذر تحميل روابط المشاركة" message={(linksQuery.error as Error).message} /> : null}

          {!linksQuery.isLoading && !linksQuery.isError ? (
            linksQuery.data?.links.length ? (
              <div className="space-y-3">
                {linksQuery.data.links.map((link) => (
                  <div key={link.id} className="rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLinkId(link.id)}
                        className={`text-start font-semibold ${selectedLinkId === link.id ? 'text-brand' : 'text-[rgb(var(--color-text-primary))]'}`}
                      >
                        {link.label}
                      </button>
                      <Badge variant={link.status === 'active' ? 'healthy' : 'neutral'}>{link.status}</Badge>
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-secondary))]">{link.sourceDevice} {'->'} {link.targetDevice}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => void onCopy('Share Link', link.viewerUrl)} disabled={!link.viewerUrl}>
                        <Copy className="h-4 w-4" />
                        نسخ الرابط
                      </Button>
                      <Button size="sm" disabled={!canControl} onClick={() => controlLinkMutation.mutate({ id: link.id, action: 'start' })}>
                        تشغيل
                      </Button>
                      <Button variant="secondary" size="sm" disabled={!canControl} onClick={() => controlLinkMutation.mutate({ id: link.id, action: 'pause' })}>
                        إيقاف مؤقت
                      </Button>
                      <Button variant="secondary" size="sm" disabled={!canControl} onClick={() => controlLinkMutation.mutate({ id: link.id, action: 'resume' })}>
                        استئناف
                      </Button>
                      <Button variant="ghost" size="sm" disabled={!canControl} onClick={() => controlLinkMutation.mutate({ id: link.id, action: 'disconnect' })}>
                        فصل
                      </Button>
                      <Button variant="danger" size="sm" disabled={!canControl} onClick={() => deleteLinkMutation.mutate(link.id)}>
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-white/10 p-4 text-sm text-[rgb(var(--color-text-secondary))]">
                لا يوجد روابط مشاركة شاشة حالياً.
              </div>
            )
          ) : null}
        </Card>
      </section>

      <Card className="premium-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">سجل جلسات Screen Share (Audit)</h3>
          <Button variant="ghost" size="sm" onClick={() => void auditQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>

        {auditQuery.isLoading ? <LoadingSkeleton className="h-24 w-full" /> : null}
        {auditQuery.isError ? <ErrorState title="تعذر تحميل سجل التدقيق" message={(auditQuery.error as Error).message} /> : null}

        {!auditQuery.isLoading && !auditQuery.isError ? (
          auditQuery.data?.events.length ? (
            <div className="space-y-2">
              {auditQuery.data.events.slice(0, 20).map((event) => (
                <div key={event.id} className="rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[rgb(var(--color-text-primary))]">{event.action}</p>
                    <span className="text-xs text-[rgb(var(--color-text-muted))]">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <p className="text-xs text-[rgb(var(--color-text-secondary))]">actor: {event.actor} ({event.role}) - target: {event.target}</p>
                  {event.details ? <p className="text-xs text-[rgb(var(--color-text-muted))]">{event.details}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-white/10 p-4 text-sm text-[rgb(var(--color-text-secondary))]">
              لا يوجد أحداث تدقيق حتى الآن.
            </div>
          )
        ) : null}
      </Card>
    </div>
  );
}
