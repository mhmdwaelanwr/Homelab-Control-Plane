import type http from 'node:http';
import { spawn } from 'node:child_process';

import type { RawData, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import { env } from '../config/env.js';
import { authService } from '../services/auth-service.js';
import { activityService } from '../services/activity-service.js';
import type { AuthSession } from '../types/auth.js';

type TerminalInboundMessage =
  | { type: 'input'; data: string }
  | { type: 'ping' }
  | { type: 'resize'; cols?: number; rows?: number };

class TerminalSocketManager {
  private wss: WebSocketServer | null = null;

  private shells = new WeakMap<WebSocket, ReturnType<typeof spawn>>();

  private tryResolveSession(token: string | undefined): AuthSession | null {
    if (!token) {
      return null;
    }

    try {
      return authService.authenticate(token);
    } catch {
      return null;
    }
  }

  attach(server: http.Server) {
    if (this.wss) {
      return;
    }

    this.wss = new WebSocketServer({ server, path: '/ws/terminal' });

    this.wss.on('connection', (socket, request) => {
      const token = new URL(request.url ?? '/', 'http://localhost').searchParams.get('token') ?? undefined;
      const session = this.tryResolveSession(token);

      if (env.wsRequireAuth && !authService.isValid(token)) {
        socket.close(1008, 'Authentication required');
        return;
      }

      if (session && session.role !== 'local-admin') {
        socket.close(1008, 'Viewer role cannot open interactive terminal shell.');
        return;
      }

      const shell = this.createShell();
      this.shells.set(socket, shell);

      socket.send(
        JSON.stringify({
          type: 'terminal.ready',
          shell: process.platform === 'win32' ? 'powershell' : 'bash',
          cwd: env.dashRoot,
          ts: Date.now(),
        }),
      );

      shell.stdout.on('data', (chunk: Buffer | string) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'terminal.data', stream: 'stdout', data: chunk.toString() }));
        }
      });

      shell.stderr.on('data', (chunk: Buffer | string) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'terminal.data', stream: 'stderr', data: chunk.toString() }));
        }
      });

      shell.on('close', (code) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'terminal.exit', code: code ?? null }));
          socket.close();
        }
      });

      socket.on('message', (raw) => this.handleMessage(socket, raw));

      socket.on('close', () => {
        this.cleanupSocket(socket);
      });
    });
  }

  private createShell() {
    const shellCommand =
      process.platform === 'win32'
        ? { command: 'powershell.exe', args: ['-NoLogo', '-NoProfile'] }
        : { command: '/bin/bash', args: ['-i'] };

    return spawn(shellCommand.command, shellCommand.args, {
      cwd: env.dashRoot,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
      windowsHide: true,
    });
  }

  private handleMessage(socket: WebSocket, raw: RawData) {
    const shell = this.shells.get(socket);
    if (!shell) {
      return;
    }

    try {
      const payload = JSON.parse(raw.toString()) as TerminalInboundMessage;

      if (payload.type === 'ping') {
        socket.send(JSON.stringify({ type: 'terminal.pong', ts: Date.now() }));
        return;
      }

      if (payload.type === 'resize') {
        socket.send(JSON.stringify({ type: 'terminal.resize.ack', cols: payload.cols ?? null, rows: payload.rows ?? null }));
        return;
      }

      if (payload.type === 'input') {
        if (shell.stdin) {
          shell.stdin.write(payload.data);
        }
        activityService.push({
          source: 'terminal',
          level: 'info',
          message: `Terminal input received (${Math.min(payload.data.length, 64)} chars).`,
        });
      }
    } catch {
      socket.send(JSON.stringify({ type: 'terminal.error', message: 'Invalid terminal payload.' }));
    }
  }

  private cleanupSocket(socket: WebSocket) {
    const shell = this.shells.get(socket);
    if (!shell) {
      return;
    }

    if (!shell.killed) {
      shell.kill();
    }

    this.shells.delete(socket);
  }
}

export const terminalSocketManager = new TerminalSocketManager();
