import { env } from '../../config/env.js';
import type { ScreenSessionMetadata, ScreenSessionState, ScreenSessionStatus, ScreenTransport } from '../../types/screen.js';

function createDefaultMetadata(): ScreenSessionMetadata {
  return {
    viewerUrl: env.screenEmbedUrl,
    viewerToken: null,
    websocketUrl: env.screenWebSocketUrl,
    relayMode: 'external-relay',
    requiresGateway: true,
    targetHost: env.screenTargetHost,
    activeDisplay: env.screenDisplayName,
    connectionType: env.screenConnectionType,
    latencyMs: null,
    connectionHealth: 'unknown',
    providerName: env.screenProvider,
    endpointUrl: env.screenEmbedUrl,
    streamingQuality: 'medium',
  };
}

export class SessionStateManager {
  private status: ScreenSessionStatus = {
    state: 'disconnected',
    connected: false,
    sessionId: null,
    transport: 'novnc',
    embedUrl: env.screenEmbedUrl,
    connectedAt: null,
    lastConnectedAt: null,
    statusMessage: 'Idle. Ready to attach to a local remote desktop relay.',
    errorReason: null,
    metadata: createDefaultMetadata(),
  };

  getStatus() {
    return this.status;
  }

  setState(state: ScreenSessionState, updates: Partial<ScreenSessionStatus> = {}) {
    this.status = {
      ...this.status,
      ...updates,
      state,
      connected: state === 'connected',
      metadata: {
        ...this.status.metadata,
        ...(updates.metadata ?? {}),
      },
    };

    return this.status;
  }

  resetDisconnected(message: string) {
    return this.setState('disconnected', {
      sessionId: null,
      transport: this.status.transport,
      embedUrl: this.status.metadata.viewerUrl,
      connectedAt: null,
      statusMessage: message,
      errorReason: null,
    });
  }

  markFailure(reason: string, transport: ScreenTransport = this.status.transport) {
    return this.setState('failed', {
      connectedAt: null,
      transport,
      statusMessage: 'Remote desktop session failed to initialize.',
      errorReason: reason,
    });
  }
}
