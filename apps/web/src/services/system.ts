import type {
  ActivityItem,
  ConnectedDevicesSnapshot,
  NetworkSnapshot,
  RealtimePayload,
  ServiceHealthSnapshot,
} from '@/types/api';

import { apiRequest } from './api';

let initialMetricsPromise: Promise<RealtimePayload> | null = null;
let initialMetricsCache: { data: RealtimePayload; expiresAt: number } | null = null;

async function requestInitialMetrics(): Promise<RealtimePayload> {
  return apiRequest<RealtimePayload>('/system/dashboard');
}

export async function fetchInitialMetrics(forceFresh = false): Promise<RealtimePayload> {
  if (!forceFresh && initialMetricsCache && initialMetricsCache.expiresAt > Date.now()) {
    return initialMetricsCache.data;
  }

  if (!forceFresh && initialMetricsPromise) {
    return initialMetricsPromise;
  }

  initialMetricsPromise = requestInitialMetrics()
    .then((payload) => {
      initialMetricsCache = {
        data: payload,
        expiresAt: Date.now() + 10_000,
      };

      return payload;
    })
    .finally(() => {
      initialMetricsPromise = null;
    });

  return initialMetricsPromise;
}

export function warmInitialMetrics() {
  return fetchInitialMetrics();
}

export function fetchNetwork() {
  return apiRequest<NetworkSnapshot>('/system/network');
}

export function fetchConnectedDevices() {
  return apiRequest<ConnectedDevicesSnapshot>('/system/devices');
}

export function fetchActivity(limit = 20) {
  return apiRequest<ActivityItem[]>(`/system/activity?limit=${limit}`);
}

export function fetchServicesHealth() {
  return apiRequest<ServiceHealthSnapshot>('/system/services-health');
}
