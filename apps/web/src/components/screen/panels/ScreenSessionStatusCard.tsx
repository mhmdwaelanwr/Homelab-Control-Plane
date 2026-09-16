import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatTimestamp } from '@/lib/utils';
import type { ScreenSessionStatus } from '@/types/api';

type ScreenSessionStatusCardProps = {
  status: ScreenSessionStatus | undefined;
};

function badgeVariant(state: ScreenSessionStatus['state'] | undefined) {
  switch (state) {
    case 'connected':
      return 'healthy';
    case 'connecting':
    case 'reconnecting':
      return 'warning';
    case 'failed':
      return 'critical';
    default:
      return 'neutral';
  }
}

export function ScreenSessionStatusCard({ status }: ScreenSessionStatusCardProps) {
  return (
    <Card className="bg-gradient-to-br from-panel/95 to-panelAlt/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-white">Session state</h3>
          <p className="mt-1 text-sm text-slate-400">Remote desktop control plane status for the current Linux host.</p>
        </div>
        <Badge variant={badgeVariant(status?.state)}>{status?.state ?? 'disconnected'}</Badge>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Target host</span><span className="text-white">{status?.metadata.targetHost ?? 'Pending host metadata'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Active display</span><span className="text-white">{status?.metadata.activeDisplay ?? ':0'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Connection type</span><span className="text-white">{status?.metadata.connectionType ?? 'Gateway-managed relay'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Viewer access</span><span className="text-white">{status?.metadata.viewerUrl ? 'Ready' : 'Pending'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Connected at</span><span className="text-white">{status?.connectedAt ? formatTimestamp(status.connectedAt) : 'Inactive'}</span></div>
        </div>
        <div className="rounded-[22px] border border-white/6 bg-panelAlt/45 p-4">
          <div className="flex items-center justify-between"><span className="text-slate-500">Last connected</span><span className="text-white">{status?.lastConnectedAt ? formatTimestamp(status.lastConnectedAt) : 'Never'}</span></div>
        </div>
      </div>
    </Card>
  );
}
