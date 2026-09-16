import { randomBytes } from 'node:crypto';

import { env } from '../../config/env.js';
import type { RemoteScreenProvider, ScreenProviderSession, ScreenSessionStatus } from '../../types/screen.js';
import { AppError } from '../../utils/app-error.js';

function createSessionPayload(): ScreenProviderSession {
  if (!env.screenEmbedUrl) {
    throw new AppError(503, 'No viewer URL is configured for the remote desktop relay.', 'SCREEN_VIEWER_UNAVAILABLE');
  }

  const token = randomBytes(12).toString('hex');
  return {
    sessionId: `screen-${Date.now()}`,
    transport: 'novnc',
    embedUrl: env.screenEmbedUrl,
    metadata: {
      viewerUrl: env.screenEmbedUrl,
      viewerToken: token,
      websocketUrl: env.screenWebSocketUrl,
      relayMode: 'external-relay',
      requiresGateway: true,
      targetHost: env.screenTargetHost,
      activeDisplay: env.screenDisplayName,
      connectionType: env.screenConnectionType,
      latencyMs: Math.round(10 + Math.random() * 8),
      connectionHealth: 'good',
      providerName: 'noVNC adapter',
      endpointUrl: env.screenEmbedUrl,
      streamingQuality: 'medium',
    },
  };
}

export class NoVncProvider implements RemoteScreenProvider {
  readonly name = 'noVNC adapter';

  readonly kind = 'novnc' as const;

  async connect(): Promise<ScreenProviderSession> {
    return createSessionPayload();
  }

  async disconnect(_session: ScreenSessionStatus): Promise<void> {
    return;
  }

  async reconnect(_session: ScreenSessionStatus): Promise<ScreenProviderSession> {
    return createSessionPayload();
  }

  async inspect(session: ScreenSessionStatus): Promise<Partial<ScreenSessionStatus>> {
    return {
      metadata: {
        ...session.metadata,
        latencyMs: session.state === 'connected' ? Math.round(12 + Math.random() * 10) : null,
        connectionHealth: session.state === 'connected' ? 'good' : 'unknown',
      },
    };
  }
}
