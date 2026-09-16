import { useEffect, useRef, useState } from 'react';

import { readToken } from '@/lib/auth';
import { defaultMetricsIntervalMs, wsUrl } from '@/lib/env';
import { fetchInitialMetrics } from '@/services/system';
import type { MetricsSocketEnvelope, RealtimePayload } from '@/types/api';

type RealtimeMetricsState = {
  data: RealtimePayload | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

function buildSocketUrl() {
  const url = new URL(wsUrl);
  const token = readToken();
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

type UseRealtimeMetricsOptions = {
  enabled?: boolean;
};

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions = {}): RealtimeMetricsState {
  const { enabled = true } = options;
  const [data, setData] = useState<RealtimePayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const pollingTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setConnected(false);
      setLoading(false);
      setError(null);
      setLastUpdated(null);
      return;
    }

    let socket: WebSocket | null = null;
    let cancelled = false;

    const clearPolling = () => {
      if (pollingTimer.current) {
        window.clearInterval(pollingTimer.current);
        pollingTimer.current = null;
      }
    };

    const applySnapshot = (payload: RealtimePayload) => {
      setData(payload);
      setLastUpdated(Date.now());
      setLoading(false);
    };

    const startPollingFallback = () => {
      if (pollingTimer.current) {
        return;
      }

      pollingTimer.current = window.setInterval(() => {
        void fetchInitialMetrics()
          .then((payload) => {
            if (!cancelled) {
              applySnapshot(payload);
            }
          })
          .catch(() => {
            // Keep the last good snapshot during polling failures.
          });
      }, defaultMetricsIntervalMs);
    };

    const connect = () => {
      socket = new WebSocket(buildSocketUrl());

      socket.onopen = () => {
        if (cancelled) {
          return;
        }

        clearPolling();
        setConnected(true);
        setError(null);
        socket?.send(JSON.stringify({ type: 'subscribe' }));
      };

      socket.onmessage = (event) => {
        const envelope = JSON.parse(event.data) as MetricsSocketEnvelope;

        if (envelope.type === 'metrics.snapshot' && envelope.data) {
          applySnapshot(envelope.data);
          return;
        }

        if (envelope.type === 'error') {
          setError(envelope.message ?? 'Live metrics transport returned an error.');
        }
      };

      socket.onerror = () => {
        setError('Live metrics socket disconnected. Falling back to interval refresh.');
        startPollingFallback();
      };

      socket.onclose = () => {
        setConnected(false);
        startPollingFallback();
        if (!cancelled) {
          reconnectTimer.current = window.setTimeout(connect, 3000);
        }
      };
    };

    void fetchInitialMetrics()
      .then((payload) => {
        if (!cancelled) {
          applySnapshot(payload);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load live metrics.');
          setLoading(false);
        }
      });

    connect();

    return () => {
      cancelled = true;
      socket?.close();
      clearPolling();
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [enabled]);

  return { data, connected, loading, error, lastUpdated };
}
