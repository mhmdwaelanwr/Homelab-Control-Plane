import type { ScreenAuditSnapshot, ScreenSessionStatus, ScreenShareLinksSnapshot } from '@/types/api';

import { apiRequest } from './api';

export function getScreenStatus() {
  return apiRequest<ScreenSessionStatus>('/screen/status');
}

export function connectScreen() {
  return apiRequest<ScreenSessionStatus>('/screen/connect', {
    method: 'POST',
  });
}

export function disconnectScreen() {
  return apiRequest<ScreenSessionStatus>('/screen/disconnect', {
    method: 'POST',
  });
}

export function reconnectScreen() {
  return apiRequest<ScreenSessionStatus>('/screen/reconnect', {
    method: 'POST',
  });
}

export function getScreenShareLinks() {
  return apiRequest<ScreenShareLinksSnapshot>('/screen/links');
}

export function createScreenShareLink(payload: { sourceDevice: string; targetDevice: string; label?: string }) {
  return apiRequest<ScreenShareLinksSnapshot>('/screen/links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteScreenShareLink(id: string) {
  return apiRequest<ScreenShareLinksSnapshot>(`/screen/links/${id}`, {
    method: 'DELETE',
  });
}

export function controlScreenShareLink(id: string, action: 'start' | 'pause' | 'resume' | 'disconnect') {
  return apiRequest<ScreenShareLinksSnapshot>(`/screen/links/${id}/control`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

export function setScreenQuality(quality: 'low' | 'medium' | 'high') {
  return apiRequest<ScreenSessionStatus>('/screen/quality', {
    method: 'PATCH',
    body: JSON.stringify({ quality }),
  });
}

export function getScreenAudit() {
  return apiRequest<ScreenAuditSnapshot>('/screen/audit');
}
