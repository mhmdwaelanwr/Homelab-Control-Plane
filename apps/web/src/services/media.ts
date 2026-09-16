import { apiBase } from '@/lib/env';
import { readToken } from '@/lib/auth';
import type { MediaBroadcastStatus, MediaLibraryResponse } from '@/types/api';

import { apiRequest } from './api';

export function getMediaStatus() {
  return apiRequest<MediaBroadcastStatus>('/media/status');
}

export function listMediaLibrary(path = '/') {
  const params = new URLSearchParams({ path });
  return apiRequest<MediaLibraryResponse>(`/media/library?${params.toString()}`);
}

export function startMediaBroadcast(payload: {
  title: string;
  sourceType: 'url' | 'file';
  source: string;
  mediaType?: 'audio' | 'video';
  posterUrl?: string | null;
}) {
  return apiRequest<MediaBroadcastStatus>('/media/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function pauseMediaBroadcast() {
  return apiRequest<MediaBroadcastStatus>('/media/pause', {
    method: 'POST',
  });
}

export function resumeMediaBroadcast() {
  return apiRequest<MediaBroadcastStatus>('/media/resume', {
    method: 'POST',
  });
}

export function stopMediaBroadcast() {
  return apiRequest<MediaBroadcastStatus>('/media/stop', {
    method: 'POST',
  });
}

export function resolveMediaPlaybackUrl(status: MediaBroadcastStatus | null) {
  if (!status?.item) {
    return null;
  }

  if (status.item.sourceType === 'url') {
    return status.item.playbackUrl;
  }

  const token = readToken();
  const apiOrigin = new URL(apiBase).origin;
  const url = new URL(status.item.playbackUrl, apiOrigin);

  if (token) {
    url.searchParams.set('token', token);
  }

  return url.toString();
}