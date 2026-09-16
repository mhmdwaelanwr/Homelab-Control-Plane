import { Plug2, PlugZap, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ScreenSessionStatus } from '@/types/api';

type ScreenConnectionControlsProps = {
  status: ScreenSessionStatus | undefined;
  busyAction: 'connect' | 'disconnect' | 'reconnect' | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
};

export function ScreenConnectionControls({
  status,
  busyAction,
  onConnect,
  onDisconnect,
  onReconnect,
}: ScreenConnectionControlsProps) {
  const isConnected = status?.state === 'connected';
  const isTransitioning = status?.state === 'connecting' || status?.state === 'reconnecting';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onConnect} disabled={isConnected || isTransitioning || busyAction !== null}>
        <PlugZap className="h-4 w-4" />
        {busyAction === 'connect' || status?.state === 'connecting' ? 'Connecting...' : 'Connect'}
      </Button>
      <Button variant="secondary" onClick={onReconnect} disabled={busyAction !== null || status?.state === 'disconnected'}>
        <RefreshCw className="h-4 w-4" />
        {busyAction === 'reconnect' || status?.state === 'reconnecting' ? 'Reconnecting...' : 'Reconnect'}
      </Button>
      <Button variant="danger" onClick={onDisconnect} disabled={!isConnected || busyAction !== null}>
        <Plug2 className="h-4 w-4" />
        {busyAction === 'disconnect' ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  );
}
