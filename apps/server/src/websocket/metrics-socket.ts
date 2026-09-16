import type http from 'node:http';

import type { RawData, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import { env } from '../config/env.js';
import { authService } from '../services/auth-service.js';
import { systemService } from '../services/system-service.js';

type ClientState = {
  subscribed: boolean;
};

type SocketCommand = {
  type?: 'subscribe' | 'unsubscribe' | 'ping';
};

class MetricsSocketManager {
  private wss: WebSocketServer | null = null;

  private state = new WeakMap<WebSocket, ClientState>();

  private intervalHandle: NodeJS.Timeout | null = null;

  attach(server: http.Server) {
    if (this.wss) {
      return;
    }

    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (socket, request) => {
      const token = new URL(request.url ?? '/', 'http://localhost').searchParams.get('token') ?? undefined;

      if (env.wsRequireAuth && !authService.isValid(token)) {
        socket.close(1008, 'Authentication required');
        return;
      }

      this.state.set(socket, { subscribed: true });
      socket.send(JSON.stringify({ type: 'connection.ready', subscribed: true, intervalMs: env.metricsBroadcastMs }));
      void this.pushSnapshot(socket);

      socket.on('message', (raw) => {
        this.handleMessage(socket, raw);
      });

      socket.on('close', () => {
        this.state.delete(socket);
      });
    });

    this.intervalHandle = setInterval(() => {
      void this.broadcast();
    }, env.metricsBroadcastMs);
  }

  private handleMessage(socket: WebSocket, raw: RawData) {
    try {
      const payload = JSON.parse(raw.toString()) as SocketCommand;
      const current = this.state.get(socket) ?? { subscribed: true };

      if (payload.type === 'unsubscribe') {
        this.state.set(socket, { ...current, subscribed: false });
        socket.send(JSON.stringify({ type: 'subscription.changed', subscribed: false }));
        return;
      }

      if (payload.type === 'subscribe') {
        this.state.set(socket, { ...current, subscribed: true });
        socket.send(JSON.stringify({ type: 'subscription.changed', subscribed: true }));
        void this.pushSnapshot(socket);
        return;
      }

      if (payload.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid socket payload.' }));
    }
  }

  private async pushSnapshot(socket: WebSocket) {
    const payload = await systemService.getPayload(true);
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: 'metrics.snapshot', data: payload }));
    }
  }

  private async broadcast() {
    if (!this.wss) {
      return;
    }

    const payload = await systemService.refresh();
    const message = JSON.stringify({ type: 'metrics.snapshot', data: payload });

    for (const client of this.wss.clients) {
      const current = this.state.get(client);
      if (client.readyState === client.OPEN && current?.subscribed !== false) {
        client.send(message);
      }
    }
  }
}

export const metricsSocketManager = new MetricsSocketManager();