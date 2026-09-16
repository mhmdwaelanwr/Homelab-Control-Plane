import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';

import mime from 'mime-types';

import { activityService } from './activity-service.js';
import { fileService } from './file-service.js';
import type {
  MediaBroadcastItem,
  MediaBroadcastStatus,
  MediaKind,
  MediaLibraryEntry,
  MediaLibraryResponse,
} from '../types/media.js';
import { AppError } from '../utils/app-error.js';

const supportedMediaExtensions: Record<string, MediaKind> = {
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  m4v: 'video',
  ogv: 'video',
};

function inferMediaKind(source: string, mimeType: string | null): MediaKind | null {
  if (mimeType?.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType?.startsWith('video/')) {
    return 'video';
  }

  const extension = source.split('.').at(-1)?.toLowerCase() ?? '';
  return supportedMediaExtensions[extension] ?? null;
}

function buildDefaultStatus(): MediaBroadcastStatus {
  return {
    state: 'idle',
    isLive: false,
    sessionId: null,
    startedAt: null,
    lastStartedAt: null,
    statusMessage: 'No media broadcast is active.',
    errorReason: null,
    item: null,
    metadata: {
      transport: 'html5-video',
      deliveryMode: 'direct-url',
      targetPath: null,
      canEmbed: true,
      providerName: 'browser-media-broadcast',
      audience: 'authenticated operators',
    },
  };
}

class MediaService {
  private status: MediaBroadcastStatus = buildDefaultStatus();

  getStatus() {
    return this.status;
  }

  async listLibrary(relativePath = '/'): Promise<MediaLibraryResponse> {
    const listing = await fileService.list(relativePath);
    const entries: MediaLibraryEntry[] = listing.entries
      .filter((entry) => entry.kind === 'directory' || Boolean(supportedMediaExtensions[entry.extension.toLowerCase()]))
      .map((entry) => ({
        name: entry.name,
        kind: entry.kind,
        relativePath: entry.relativePath,
        extension: entry.extension,
        size: entry.size,
        modifiedAt: entry.modifiedAt,
        mediaType: entry.kind === 'file' ? supportedMediaExtensions[entry.extension.toLowerCase()] ?? null : null,
        mimeType: entry.kind === 'file' ? (mime.lookup(entry.name) || null) : null,
      }));

    return {
      rootPath: listing.rootPath,
      currentPath: listing.currentPath,
      breadcrumbs: listing.breadcrumbs,
      entries,
    };
  }

  async startBroadcast(input: {
    title: string;
    sourceType: 'url' | 'file';
    source: string;
    mediaType?: MediaKind;
    posterUrl?: string | null;
  }) {
    this.status = {
      ...this.status,
      state: 'starting',
      isLive: false,
      statusMessage: 'Preparing the media broadcast and validating playback source.',
      errorReason: null,
    };

    try {
      const item = input.sourceType === 'file'
        ? await this.createFileBroadcastItem(input)
        : this.createUrlBroadcastItem(input);
      const now = Date.now();

      this.status = {
        state: 'live',
        isLive: true,
        sessionId: randomBytes(12).toString('hex'),
        startedAt: now,
        lastStartedAt: now,
        statusMessage: `${item.mediaType === 'audio' ? 'Audio' : 'Video'} broadcast is live for authenticated operators.`,
        errorReason: null,
        item,
        metadata: {
          transport: item.mediaType === 'audio' ? 'html5-audio' : 'html5-video',
          deliveryMode: item.sourceType === 'file' ? 'authenticated-stream' : 'direct-url',
          targetPath: item.sourceType === 'file' ? item.source : null,
          canEmbed: true,
          providerName: 'browser-media-broadcast',
          audience: 'authenticated operators',
        },
      };

      activityService.push({
        source: 'media',
        level: 'info',
        message: `Started ${item.mediaType} broadcast: ${item.title}.`,
      });

      return this.status;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unable to start media broadcast.';
      this.status = {
        ...buildDefaultStatus(),
        state: 'failed',
        statusMessage: 'Media broadcast failed to start.',
        errorReason: reason,
      };

      throw error;
    }
  }

  pauseBroadcast() {
    if (!this.status.item || this.status.state !== 'live') {
      throw new AppError(400, 'A live media broadcast is required before pausing.', 'MEDIA_NOT_LIVE');
    }

    const currentItem = this.status.item;

    this.status = {
      ...this.status,
      state: 'paused',
      isLive: false,
      statusMessage: 'Media broadcast is paused and can be resumed.',
      errorReason: null,
    };
    activityService.push({
      source: 'media',
      level: 'warning',
      message: `Paused media broadcast: ${currentItem.title}.`,
    });
    return this.status;
  }

  resumeBroadcast() {
    if (!this.status.item || this.status.state !== 'paused') {
      throw new AppError(400, 'A paused media broadcast is required before resuming.', 'MEDIA_NOT_PAUSED');
    }

    const currentItem = this.status.item;

    this.status = {
      ...this.status,
      state: 'live',
      isLive: true,
      statusMessage: 'Media broadcast resumed for authenticated operators.',
      errorReason: null,
    };
    activityService.push({
      source: 'media',
      level: 'info',
      message: `Resumed media broadcast: ${currentItem.title}.`,
    });
    return this.status;
  }

  stopBroadcast() {
    const previousItem = this.status.item;
    this.status = {
      ...buildDefaultStatus(),
      lastStartedAt: this.status.lastStartedAt,
      statusMessage: 'Media broadcast stopped.',
    };

    if (previousItem) {
      activityService.push({
        source: 'media',
        level: 'warning',
        message: `Stopped media broadcast: ${previousItem.title}.`,
      });
    }

    return this.status;
  }

  async resolveStreamSource(relativePath: string) {
    const location = await fileService.resolveDownload(relativePath);
    const stats = await fs.stat(location.absolute);
    const mimeType = mime.lookup(location.absolute) || 'application/octet-stream';
    const mediaType = inferMediaKind(location.absolute, mimeType);

    if (!mediaType) {
      throw new AppError(400, 'The selected file is not a supported audio or video format.', 'UNSUPPORTED_MEDIA_FILE');
    }

    return {
      absolute: location.absolute,
      size: stats.size,
      mimeType,
      mediaType,
      filename: location.absolute.split(/[/\\]/).at(-1) ?? 'media',
    };
  }

  private async createFileBroadcastItem(input: {
    title: string;
    source: string;
    mediaType?: MediaKind;
    posterUrl?: string | null;
  }): Promise<MediaBroadcastItem> {
    const streamSource = await this.resolveStreamSource(input.source);
    const inferredType = input.mediaType ?? streamSource.mediaType;

    if (inferredType !== streamSource.mediaType) {
      throw new AppError(400, 'The chosen media type does not match the selected file.', 'MEDIA_TYPE_MISMATCH');
    }

    return {
      title: input.title,
      sourceType: 'file',
      source: input.source,
      mediaType: inferredType,
      mimeType: streamSource.mimeType,
      posterUrl: input.posterUrl ?? null,
      playbackUrl: `/api/media/stream?path=${encodeURIComponent(input.source)}`,
    };
  }

  private createUrlBroadcastItem(input: {
    title: string;
    source: string;
    mediaType?: MediaKind;
    posterUrl?: string | null;
  }): MediaBroadcastItem {
    let normalizedUrl: URL;

    try {
      normalizedUrl = new URL(input.source);
    } catch {
      throw new AppError(400, 'A valid http or https media URL is required.', 'INVALID_MEDIA_URL');
    }

    if (!['http:', 'https:'].includes(normalizedUrl.protocol)) {
      throw new AppError(400, 'Only http and https media URLs are supported.', 'INVALID_MEDIA_URL_PROTOCOL');
    }

    const mimeType = mime.lookup(normalizedUrl.pathname) || null;
    const inferredType = input.mediaType ?? inferMediaKind(normalizedUrl.pathname, mimeType);

    if (!inferredType) {
      throw new AppError(400, 'Unable to infer whether the media URL is audio or video. Choose a supported file extension or specify the type.', 'UNSUPPORTED_MEDIA_URL');
    }

    return {
      title: input.title,
      sourceType: 'url',
      source: normalizedUrl.toString(),
      mediaType: inferredType,
      mimeType,
      posterUrl: input.posterUrl ?? null,
      playbackUrl: normalizedUrl.toString(),
    };
  }
}

export const mediaService = new MediaService();