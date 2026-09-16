import { Copy, Expand, ExternalLink, Link2Off, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import type { ScreenSessionStatus } from '@/types/api';

type RemoteViewerPanelProps = {
  status: ScreenSessionStatus | undefined;
  isBusy?: boolean;
  onReconnect?: () => void;
  onOpenViewer?: () => void;
  onCopyViewerUrl?: () => void;
};

export function RemoteViewerPanel({ status, isBusy = false, onReconnect, onOpenViewer, onCopyViewerUrl }: RemoteViewerPanelProps) {
  const handleFullscreen = () => {
    const target = document.getElementById('remote-viewer-frame');
    if (target?.requestFullscreen) {
      void target.requestFullscreen();
    }
  };

  const isConnected = status?.state === 'connected';
  const isConnecting = status?.state === 'connecting' || status?.state === 'reconnecting';
  const isFailed = status?.state === 'failed';

  return (
    <Card className="h-full overflow-hidden border-white/8 bg-gradient-to-br from-panel/90 via-panelAlt/80 to-panel/95 p-0">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <div>
          <h3 className="font-display text-xl text-white">Remote session viewport</h3>
          <p className="text-sm text-slate-400">Isolated browser viewer prepared for noVNC-compatible local relay integration</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'healthy' : isFailed ? 'critical' : status?.state === 'reconnecting' ? 'warning' : 'neutral'}>
            {status?.state ?? 'idle'}
          </Badge>
          {onCopyViewerUrl ? (
            <Button variant="ghost" onClick={onCopyViewerUrl} disabled={isBusy}>
              <Copy className="h-4 w-4" />
            </Button>
          ) : null}
          {onOpenViewer ? (
            <Button variant="ghost" onClick={onOpenViewer} disabled={isBusy}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          ) : null}
          {onReconnect ? (
            <Button variant="ghost" onClick={onReconnect} disabled={isBusy}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="ghost" onClick={handleFullscreen}>
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="remote-viewer-frame" className="relative aspect-[16/9] min-h-[480px] bg-[radial-gradient(circle_at_top,rgba(86,195,255,0.12),transparent_32%),linear-gradient(180deg,#05090d,#0c141d)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-white/5 to-transparent" />
        {isConnecting ? (
          <div className="flex h-full flex-col justify-between p-8">
            <LoadingSkeleton className="h-8 w-40" />
            <div className="grid gap-4 md:grid-cols-3">
              <LoadingSkeleton className="h-28 w-full" />
              <LoadingSkeleton className="h-28 w-full" />
              <LoadingSkeleton className="h-28 w-full" />
            </div>
          </div>
        ) : isConnected && status?.embedUrl ? (
          <iframe className="h-full w-full border-0" src={status.embedUrl} title="Remote screen viewer" />
        ) : isFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <ShieldAlert className="h-10 w-10 text-danger" />
            <div>
              <p className="font-display text-2xl text-white">Viewer initialization failed</p>
              <p className="mt-2 max-w-lg text-sm text-slate-400">
                {status?.errorReason ?? 'The backend could not prepare a managed browser viewer for this remote session.'}
              </p>
            </div>
            {onReconnect ? (
              <Button onClick={onReconnect} disabled={isBusy}>
                <RefreshCw className="h-4 w-4" />Retry session
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            {status?.state === 'disconnected' ? <Link2Off className="h-10 w-10 text-slate-600" /> : <WifiOff className="h-10 w-10 text-slate-600" />}
            <div>
              <p className="font-display text-2xl text-white">Remote viewport idle</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Connect a local remote desktop relay to attach the Linux desktop safely through a browser-compatible gateway.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/6 bg-slate-950/60 px-5 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 backdrop-blur-sm">
          <span>{status?.metadata.targetHost ?? 'local-host'}</span>
          <span>{status?.metadata.activeDisplay ?? ':0'}</span>
          <span>{status?.metadata.latencyMs != null ? `${status.metadata.latencyMs} ms` : 'Latency pending'}</span>
          <span>{status?.metadata.providerName ?? 'remote-provider'}</span>
        </div>
      </div>
    </Card>
  );
}

