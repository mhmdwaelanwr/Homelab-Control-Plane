export type ScreenSessionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export type ScreenTransport = 'novnc' | 'tigervnc' | 'x11vnc' | 'placeholder';

export type ScreenQuality = 'low' | 'medium' | 'high';

export interface ScreenSessionMetadata {
  viewerUrl: string | null;
  viewerToken: string | null;
  websocketUrl: string | null;
  relayMode: 'external-relay' | 'browser-embed' | 'placeholder';
  requiresGateway: boolean;
  targetHost: string;
  activeDisplay: string;
  connectionType: string;
  latencyMs: number | null;
  connectionHealth: 'good' | 'degraded' | 'unknown';
  providerName: string;
  endpointUrl: string | null;
  streamingQuality: ScreenQuality;
}

export interface ScreenSessionStatus {
  state: ScreenSessionState;
  connected: boolean;
  sessionId: string | null;
  transport: ScreenTransport;
  embedUrl: string | null;
  connectedAt: number | null;
  lastConnectedAt: number | null;
  statusMessage: string;
  errorReason: string | null;
  metadata: ScreenSessionMetadata;
}

export interface ScreenProviderSession {
  sessionId: string;
  transport: ScreenTransport;
  embedUrl: string;
  metadata: ScreenSessionMetadata;
}

export interface ScreenShareLink {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  label: string;
  status: 'active' | 'idle';
  createdAt: number;
  viewerUrl: string | null;
}

export interface ScreenShareLinksSnapshot {
  links: ScreenShareLink[];
  updatedAt: number;
}

export interface ScreenAuditEvent {
  id: string;
  actor: string;
  role: 'local-admin' | 'local-viewer' | 'system';
  action: string;
  target: string;
  timestamp: number;
  details?: string;
}

export interface ScreenAuditSnapshot {
  events: ScreenAuditEvent[];
  updatedAt: number;
}

export interface RemoteScreenProvider {
  readonly name: string;
  readonly kind: ScreenTransport;
  connect(): Promise<ScreenProviderSession>;
  disconnect(session: ScreenSessionStatus): Promise<void>;
  reconnect(session: ScreenSessionStatus): Promise<ScreenProviderSession>;
  inspect(session: ScreenSessionStatus): Promise<Partial<ScreenSessionStatus>>;
}
