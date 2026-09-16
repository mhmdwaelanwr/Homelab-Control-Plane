import type { BreadcrumbItem } from './files.js';

export type MediaSourceType = 'url' | 'file';
export type MediaKind = 'audio' | 'video';

export interface MediaBroadcastItem {
  title: string;
  sourceType: MediaSourceType;
  source: string;
  mediaType: MediaKind;
  mimeType: string | null;
  posterUrl: string | null;
  playbackUrl: string;
}

export interface MediaBroadcastStatus {
  state: 'idle' | 'starting' | 'live' | 'paused' | 'failed';
  isLive: boolean;
  sessionId: string | null;
  startedAt: number | null;
  lastStartedAt: number | null;
  statusMessage: string;
  errorReason: string | null;
  item: MediaBroadcastItem | null;
  metadata: {
    transport: 'html5-audio' | 'html5-video';
    deliveryMode: 'authenticated-stream' | 'direct-url';
    targetPath: string | null;
    canEmbed: boolean;
    providerName: string;
    audience: string;
  };
}

export interface MediaLibraryEntry {
  name: string;
  kind: 'directory' | 'file';
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: number;
  mediaType: MediaKind | null;
  mimeType: string | null;
}

export interface MediaLibraryResponse {
  rootPath: string;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  entries: MediaLibraryEntry[];
}