import os from 'node:os';
import path from 'node:path';

const fallbackRoot = process.platform === 'win32' ? process.cwd() : '/';

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  dashRoot: process.env.DASH_ROOT ?? fallbackRoot,
  adminUser: requireEnv('ADMIN_USER'),
  adminPassword: requireEnv('ADMIN_PASSWORD'),
  viewerUser: process.env.VIEWER_USER?.trim() ?? '',
  viewerPassword: process.env.VIEWER_PASSWORD ?? '',
  screenProvider: process.env.SCREEN_PROVIDER ?? 'novnc',
  screenEmbedUrl: process.env.SCREEN_EMBED_URL ?? 'http://localhost:6080/vnc.html',
  screenWebSocketUrl: process.env.SCREEN_WEBSOCKET_URL ?? 'ws://localhost:6080/websockify',
  screenTargetHost: process.env.SCREEN_TARGET_HOST ?? os.hostname(),
  screenDisplayName: process.env.SCREEN_DISPLAY_NAME ?? ':0',
  screenConnectionType: process.env.SCREEN_CONNECTION_TYPE ?? 'noVNC gateway',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  metricsBroadcastMs: Number(process.env.METRICS_BROADCAST_MS ?? 2000),
  wsRequireAuth: process.env.WS_REQUIRE_AUTH === 'true',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024),
  terminalCommandTimeoutMs: Number(process.env.TERMINAL_COMMAND_TIMEOUT_MS ?? 20_000),
  hostName: os.hostname(),
};
