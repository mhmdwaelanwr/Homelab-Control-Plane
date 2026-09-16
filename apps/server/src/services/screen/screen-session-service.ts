import { activityService } from '../activity-service.js';
import { NoVncProvider } from '../screen-providers/novnc-provider.js';
import type {
  RemoteScreenProvider,
  ScreenProviderSession,
  ScreenSessionStatus,
  ScreenQuality,
  ScreenShareLink,
  ScreenAuditEvent,
  ScreenAuditSnapshot,
  ScreenShareLinksSnapshot,
} from '../../types/screen.js';
import { SessionStateManager } from './session-state-manager.js';

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class ScreenSessionService {
  private readonly stateManager = new SessionStateManager();

  private links: ScreenShareLink[] = [];

  private auditEvents: ScreenAuditEvent[] = [];

  private readonly provider: RemoteScreenProvider;

  constructor(provider: RemoteScreenProvider = new NoVncProvider()) {
    this.provider = provider;
  }

  private recordAudit(event: Omit<ScreenAuditEvent, 'id' | 'timestamp'>) {
    this.auditEvents.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      timestamp: Date.now(),
      ...event,
    });

    this.auditEvents = this.auditEvents.slice(0, 200);
  }

  getAudit(): ScreenAuditSnapshot {
    return {
      events: this.auditEvents,
      updatedAt: Date.now(),
    };
  }

  async getStatus(): Promise<ScreenSessionStatus> {
    const current = this.stateManager.getStatus();
    const inspection = await this.provider.inspect(current);
    return this.stateManager.setState(current.state, inspection);
  }

  async connect(actor?: { username: string; role: 'local-admin' | 'local-viewer' }): Promise<ScreenSessionStatus> {
    this.stateManager.setState('connecting', {
      statusMessage: 'Provisioning the remote desktop relay and validating the viewer endpoint.',
      errorReason: null,
    });

    try {
      const session = await this.provider.connect();
      await delay(900);
      const status = this.applyConnectedSession(session, 'Remote desktop relay ready. Viewer can attach now.');
      activityService.push({
        source: 'screen',
        level: 'info',
        message: `Remote display relay session ${status.sessionId} opened for ${status.metadata.targetHost}.`,
      });
      this.recordAudit({
        actor: actor?.username ?? 'system',
        role: actor?.role ?? 'system',
        action: 'screen.connect',
        target: status.metadata.targetHost,
        details: `session=${status.sessionId}`,
      });
      return status;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Remote relay unavailable.';
      return this.stateManager.markFailure(reason);
    }
  }

  async disconnect(actor?: { username: string; role: 'local-admin' | 'local-viewer' }): Promise<ScreenSessionStatus> {
    const current = this.stateManager.getStatus();
    await this.provider.disconnect(current);
    const status = this.stateManager.resetDisconnected('Remote desktop relay disconnected.');
    activityService.push({
      source: 'screen',
      level: 'warning',
      message: 'Remote display relay session closed.',
    });
    this.recordAudit({
      actor: actor?.username ?? 'system',
      role: actor?.role ?? 'system',
      action: 'screen.disconnect',
      target: current.metadata.targetHost,
      details: `session=${current.sessionId ?? 'none'}`,
    });
    return status;
  }

  async reconnect(actor?: { username: string; role: 'local-admin' | 'local-viewer' }): Promise<ScreenSessionStatus> {
    const current = this.stateManager.getStatus();
    this.stateManager.setState('reconnecting', {
      statusMessage: 'Re-establishing the remote desktop relay and refreshing viewer credentials.',
      errorReason: null,
    });

    try {
      const session = await this.provider.reconnect(current);
      await delay(700);
      const status = this.applyConnectedSession(session, 'Remote desktop relay recovered and ready for viewing.');
      activityService.push({
        source: 'screen',
        level: 'info',
        message: `Remote display relay session ${status.sessionId} reconnected.`,
      });
      this.recordAudit({
        actor: actor?.username ?? 'system',
        role: actor?.role ?? 'system',
        action: 'screen.reconnect',
        target: status.metadata.targetHost,
        details: `session=${status.sessionId}`,
      });
      return status;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Remote relay unavailable.';
      return this.stateManager.markFailure(reason);
    }
  }

  getShareLinks(): ScreenShareLinksSnapshot {
    return {
      links: this.links.slice(0, 50),
      updatedAt: Date.now(),
    };
  }

  createShareLink(
    input: { sourceDevice: string; targetDevice: string; label?: string },
    actor?: { username: string; role: 'local-admin' | 'local-viewer' },
  ): ScreenShareLinksSnapshot {
    const sourceDevice = input.sourceDevice.trim();
    const targetDevice = input.targetDevice.trim();

    if (!sourceDevice || !targetDevice) {
      return this.getShareLinks();
    }

    const link: ScreenShareLink = {
      id: `link-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      sourceDevice,
      targetDevice,
      label: input.label?.trim() || `${sourceDevice} -> ${targetDevice}`,
      status: 'active',
      createdAt: Date.now(),
      viewerUrl: this.stateManager.getStatus().metadata.viewerUrl,
    };

    this.links.unshift(link);
    this.links = this.links.slice(0, 50);

    activityService.push({
      source: 'screen',
      level: 'info',
      message: `Screen share link created: ${sourceDevice} -> ${targetDevice}.`,
    });
    this.recordAudit({
      actor: actor?.username ?? 'system',
      role: actor?.role ?? 'system',
      action: 'screen.link.create',
      target: `${sourceDevice}->${targetDevice}`,
      details: link.label,
    });

    return this.getShareLinks();
  }

  removeShareLink(id: string, actor?: { username: string; role: 'local-admin' | 'local-viewer' }): ScreenShareLinksSnapshot {
    this.links = this.links.filter((item) => item.id !== id);
    activityService.push({
      source: 'screen',
      level: 'warning',
      message: `Screen share link ${id} removed.`,
    });
    this.recordAudit({
      actor: actor?.username ?? 'system',
      role: actor?.role ?? 'system',
      action: 'screen.link.remove',
      target: id,
    });

    return this.getShareLinks();
  }

  controlShareLink(
    id: string,
    action: 'start' | 'pause' | 'resume' | 'disconnect',
    actor?: { username: string; role: 'local-admin' | 'local-viewer' },
  ): ScreenShareLinksSnapshot {
    const currentViewer = this.stateManager.getStatus().metadata.viewerUrl;

    this.links = this.links.map((item) => {
      if (item.id !== id) {
        return item;
      }

      if (action === 'start' || action === 'resume') {
        return {
          ...item,
          status: 'active',
          viewerUrl: currentViewer,
        };
      }

      if (action === 'pause' || action === 'disconnect') {
        return {
          ...item,
          status: 'idle',
          viewerUrl: action === 'disconnect' ? null : item.viewerUrl,
        };
      }

      return item;
    });

    activityService.push({
      source: 'screen',
      level: action === 'disconnect' ? 'warning' : 'info',
      message: `Screen share link ${id} action applied: ${action}.`,
    });
    this.recordAudit({
      actor: actor?.username ?? 'system',
      role: actor?.role ?? 'system',
      action: `screen.link.${action}`,
      target: id,
    });

    return this.getShareLinks();
  }

  setQuality(quality: ScreenQuality, actor?: { username: string; role: 'local-admin' | 'local-viewer' }): ScreenSessionStatus {
    const current = this.stateManager.getStatus();
    const next = this.stateManager.setState(current.state, {
      metadata: {
        ...current.metadata,
        streamingQuality: quality,
      },
      statusMessage: `Streaming quality set to ${quality}.`,
    });

    this.recordAudit({
      actor: actor?.username ?? 'system',
      role: actor?.role ?? 'system',
      action: 'screen.quality.set',
      target: current.metadata.targetHost,
      details: `quality=${quality}`,
    });

    return next;
  }

  private applyConnectedSession(session: ScreenProviderSession, message: string) {
    return this.stateManager.setState('connected', {
      sessionId: session.sessionId,
      transport: session.transport,
      embedUrl: session.embedUrl,
      connectedAt: Date.now(),
      lastConnectedAt: Date.now(),
      statusMessage: message,
      errorReason: null,
      metadata: session.metadata,
    });
  }
}
