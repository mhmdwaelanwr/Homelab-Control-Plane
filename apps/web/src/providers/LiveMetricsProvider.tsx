import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics';
import type { RealtimePayload } from '@/types/api';

type LiveMetricsContextValue = {
  data: RealtimePayload | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

const LiveMetricsContext = createContext<LiveMetricsContextValue | null>(null);

export function LiveMetricsProvider({ children }: PropsWithChildren) {
  const { token, loading: authLoading } = useAuth();
  const metricsEnabled = !authLoading && Boolean(token);
  const { data, connected, loading, error, lastUpdated } = useRealtimeMetrics({ enabled: metricsEnabled });

  const value = useMemo(
    () => ({
      data,
      connected,
      loading: authLoading ? true : loading,
      error,
      lastUpdated,
    }),
    [authLoading, connected, data, error, lastUpdated, loading],
  );

  return <LiveMetricsContext.Provider value={value}>{children}</LiveMetricsContext.Provider>;
}

export function useLiveMetrics() {
  const context = useContext(LiveMetricsContext);
  if (!context) {
    throw new Error('useLiveMetrics must be used within LiveMetricsProvider');
  }

  return context;
}
