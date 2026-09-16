import { Copy, ExternalLink, ShieldCheck, Waypoints } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ScreenSessionStatus } from '@/types/api';

type ScreenDiagnosticsPanelProps = {
  status: ScreenSessionStatus | undefined;
  onCopyViewerUrl?: () => void;
  onCopyWebsocketUrl?: () => void;
  onCopySummary?: () => void;
  onOpenViewer?: () => void;
};

function healthVariant(health: ScreenSessionStatus['metadata']['connectionHealth'] | undefined) {
  if (health === 'good') {
    return 'healthy';
  }

  if (health === 'degraded') {
    return 'warning';
  }

  return 'neutral';
}

function relayLabel(relayMode: ScreenSessionStatus['metadata']['relayMode'] | undefined) {
  if (relayMode === 'external-relay') {
    return 'External relay';
  }

  if (relayMode === 'browser-embed') {
    return 'Browser embed';
  }

  return 'Awaiting relay';
}

export function ScreenDiagnosticsPanel({
  status,
  onCopyViewerUrl,
  onCopyWebsocketUrl,
  onCopySummary,
  onOpenViewer,
}: ScreenDiagnosticsPanelProps) {
  return (
    <Card className="bg-gradient-to-br from-panel/95 to-panelAlt/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-white">Diagnostics</h3>
          <p className="mt-1 text-sm text-slate-400">Relay metadata, viewer path, and connection readiness stay visible here.</p>
        </div>
        <Badge variant={healthVariant(status?.metadata.connectionHealth)}>{status?.metadata.connectionHealth ?? 'unknown'}</Badge>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-400">
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span>Provider</span>
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <p className="text-white">{status?.metadata.providerName ?? 'Awaiting provider metadata'}</p>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span>Relay mode</span>
            <Waypoints className="h-4 w-4 text-info" />
          </div>
          <p className="text-white">{relayLabel(status?.metadata.relayMode)}</p>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span>Endpoint</span><span className="max-w-[160px] truncate text-white">{status?.metadata.endpointUrl ?? 'Viewer endpoint unavailable'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span>WebSocket</span><span className="max-w-[160px] truncate text-white">{status?.metadata.websocketUrl ?? 'Socket pending'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span>Gateway</span><span className="text-white">{status?.metadata.requiresGateway ? 'Required' : 'Optional'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span>Latency</span><span className="text-white">{status?.metadata.latencyMs != null ? `${status.metadata.latencyMs} ms` : 'Pending'}</span></div>
        </div>

        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <p className="mb-2 text-slate-500">Status detail</p>
          <p className="text-white">{status?.statusMessage ?? 'Session state unavailable.'}</p>
          {status?.errorReason ? <p className="mt-3 text-danger">{status.errorReason}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" size="sm" onClick={onCopyViewerUrl} disabled={!onCopyViewerUrl}>
          <Copy className="h-4 w-4" />
          Copy viewer
        </Button>
        <Button variant="secondary" size="sm" onClick={onCopyWebsocketUrl} disabled={!onCopyWebsocketUrl}>
          <Copy className="h-4 w-4" />
          Copy socket
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenViewer} disabled={!onOpenViewer}>
          <ExternalLink className="h-4 w-4" />
          Open viewer
        </Button>
        <Button variant="ghost" size="sm" onClick={onCopySummary} disabled={!onCopySummary}>
          <Copy className="h-4 w-4" />
          Copy summary
        </Button>
      </div>
    </Card>
  );
}
