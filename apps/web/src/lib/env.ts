const fallbackApiOrigin = 'http://localhost:4000';

export const apiBase = `${import.meta.env.VITE_API_URL ?? fallbackApiOrigin}/api`;

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const wsUrl =
  import.meta.env.VITE_WS_URL ?? `${wsProtocol}//${new URL(import.meta.env.VITE_API_URL ?? fallbackApiOrigin).host}/ws`;

export const terminalWsUrl =
  import.meta.env.VITE_TERMINAL_WS_URL ?? `${wsProtocol}//${new URL(import.meta.env.VITE_API_URL ?? fallbackApiOrigin).host}/ws/terminal`;

export const defaultMetricsIntervalMs = Number(import.meta.env.VITE_METRICS_INTERVAL_MS ?? 2000);
