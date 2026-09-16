import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, FolderTree, Pause, Play, RefreshCw, Search, Square, Video, Volume2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { FileBreadcrumbs } from '@/components/file-manager/FileBreadcrumbs';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, copyToClipboard, formatBytes, formatRelativeTime, formatTimestamp } from '@/lib/utils';
import {
  getMediaStatus,
  listMediaLibrary,
  pauseMediaBroadcast,
  resolveMediaPlaybackUrl,
  resumeMediaBroadcast,
  startMediaBroadcast,
  stopMediaBroadcast,
} from '@/services/media';
import type { MediaBroadcastStatus, MediaLibraryEntry } from '@/types/api';
import { useToast } from '@/providers/ToastProvider';

function stateVariant(state: MediaBroadcastStatus['state']) {
  if (state === 'live') return 'healthy';
  if (state === 'failed') return 'critical';
  if (state === 'starting' || state === 'paused') return 'warning';
  return 'neutral';
}

export function MediaBroadcastPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [libraryPath, setLibraryPath] = useState('/');
  const [sourceType, setSourceType] = useState<'url' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<MediaLibraryEntry | null>(null);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('video');
  const [posterUrl, setPosterUrl] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');

  const deferredLibrarySearch = useDeferredValue(librarySearch);

  const statusQuery = useQuery({ queryKey: ['media-status'], queryFn: getMediaStatus, refetchInterval: 5000 });
  const libraryQuery = useQuery({ queryKey: ['media-library', libraryPath], queryFn: () => listMediaLibrary(libraryPath) });

  const startMutation = useMutation({
    mutationFn: startMediaBroadcast,
    onSuccess: async (status) => {
      queryClient.setQueryData(['media-status'], status);
      await queryClient.invalidateQueries({ queryKey: ['media-status'] });
      pushToast({ title: 'Broadcast live', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'Start failed', description: (error as Error).message, variant: 'danger' }),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseMediaBroadcast,
    onSuccess: (status) => {
      queryClient.setQueryData(['media-status'], status);
      pushToast({ title: 'Paused', variant: 'warning' });
    },
    onError: (error) => pushToast({ title: 'Pause failed', description: (error as Error).message, variant: 'danger' }),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeMediaBroadcast,
    onSuccess: (status) => {
      queryClient.setQueryData(['media-status'], status);
      pushToast({ title: 'Resumed', variant: 'success' });
    },
    onError: (error) => pushToast({ title: 'Resume failed', description: (error as Error).message, variant: 'danger' }),
  });

  const stopMutation = useMutation({
    mutationFn: stopMediaBroadcast,
    onSuccess: (status) => {
      queryClient.setQueryData(['media-status'], status);
      pushToast({ title: 'Stopped', variant: 'warning' });
    },
    onError: (error) => pushToast({ title: 'Stop failed', description: (error as Error).message, variant: 'danger' }),
  });

  const busy = startMutation.isPending || pauseMutation.isPending || resumeMutation.isPending || stopMutation.isPending;
  const status = statusQuery.data ?? null;
  const playbackUrl = resolveMediaPlaybackUrl(status);
  const activeSource = status?.item?.source ?? source.trim();

  const entries = libraryQuery.data?.entries ?? [];
  const filteredEntries = useMemo(() => {
    const q = deferredLibrarySearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => [entry.name, entry.relativePath, entry.extension, entry.mediaType ?? '', entry.mimeType ?? ''].join(' ').toLowerCase().includes(q));
  }, [deferredLibrarySearch, entries]);

  const directories = filteredEntries.filter((entry) => entry.kind === 'directory');
  const files = filteredEntries.filter((entry) => entry.kind === 'file');

  const stats = entries.reduce(
    (acc, entry) => {
      if (entry.kind === 'directory') acc.directories += 1;
      if (entry.kind === 'file') {
        acc.files += 1;
        if (entry.mediaType === 'audio') acc.audio += 1;
        if (entry.mediaType === 'video') acc.video += 1;
      }
      return acc;
    },
    { directories: 0, files: 0, audio: 0, video: 0 },
  );

  function selectEntry(entry: MediaLibraryEntry) {
    if (entry.kind === 'directory') {
      setLibraryPath(entry.relativePath);
      return;
    }
    setSourceType('file');
    setSelectedFile(entry);
    setSource(entry.relativePath);
    setTitle(entry.name.replace(/\.[^.]+$/, ''));
    setMediaType(entry.mediaType ?? 'video');
  }

  function submit() {
    startMutation.mutate({
      title: title.trim() || selectedFile?.name || 'Untitled',
      sourceType,
      source: source.trim(),
      mediaType,
      posterUrl: posterUrl.trim() || null,
    });
  }

  async function onCopy(label: string, value: string | null | undefined) {
    if (!value) return;
    await copyToClipboard(value);
    pushToast({ title: `${label} copied`, description: value, variant: 'success' });
  }

  function openExternal(url: string | null | undefined) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Ops Stream</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Operations Broadcast</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stateVariant(status?.state ?? 'idle')}>{status?.state ?? 'idle'}</Badge>
            <Button variant="ghost" size="icon" onClick={() => { void statusQuery.refetch(); void libraryQuery.refetch(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {statusQuery.isError ? <ErrorState message={(statusQuery.error as Error).message} onRetry={() => void statusQuery.refetch()} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Transport', value: status?.metadata.transport ?? 'Direct' },
              { label: 'Type', value: status?.item?.mediaType ?? 'None' },
              { label: 'Delivery', value: status?.metadata.deliveryMode ?? 'idle' },
              { label: 'Library', value: `${stats.files} media files` },
            ].map((item) => (
              <div key={item.label} className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] text-[rgb(var(--color-text-muted))]">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button disabled={busy || !source.trim() || status?.state === 'live'} onClick={submit}>
              <Play className="h-4 w-4" />
              Go Live
            </Button>
            <Button variant="secondary" disabled={busy || !status?.item} onClick={() => stopMutation.mutate()}>
              <Square className="h-4 w-4" />
              End
            </Button>
            <Button variant="secondary" disabled={busy || status?.state !== 'live'} onClick={() => pauseMutation.mutate()}>
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button variant="secondary" disabled={busy || status?.state !== 'paused'} onClick={() => resumeMutation.mutate()}>
              <Play className="h-4 w-4" />
              Resume
            </Button>
          </div>

          <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
            {status?.errorReason ?? status?.statusMessage ?? 'Ready'}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-[rgb(var(--color-text-secondary))]">Session Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Session" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[rgb(var(--color-text-secondary))]">Media Type</label>
              <select
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value as 'audio' | 'video')}
                className="h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant={sourceType === 'file' ? 'primary' : 'secondary'} onClick={() => setSourceType('file')}>File</Button>
            <Button variant={sourceType === 'url' ? 'primary' : 'secondary'} onClick={() => setSourceType('url')}>URL</Button>
          </div>

          <div className="mt-4 space-y-2">
              <label className="text-sm text-[rgb(var(--color-text-secondary))]">Source Path / URL</label>
            <Input value={source} onChange={(event) => setSource(event.target.value)} placeholder={sourceType === 'file' ? '/media/file.mp4' : 'https://example.com/video.mp4'} />
          </div>

          <div className="mt-4 space-y-2">
              <label className="text-sm text-[rgb(var(--color-text-secondary))]">Poster URL</label>
            <Input value={posterUrl} onChange={(event) => setPosterUrl(event.target.value)} placeholder="Optional" />
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Operator Preview</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => void onCopy('Playback URL', playbackUrl)} disabled={!playbackUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openExternal(playbackUrl)} disabled={!playbackUrl}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-[260px] rounded-[16px] border border-white/10 bg-black/20 p-3">
            {statusQuery.isLoading ? <LoadingSkeleton className="h-[220px] w-full" /> : null}

            {!statusQuery.isLoading && playbackUrl && status?.item?.mediaType === 'video' ? (
              <video key={playbackUrl} className="h-full w-full rounded-[12px] bg-black object-contain" controls autoPlay={status.state === 'live'} poster={status.item.posterUrl ?? undefined} src={playbackUrl} />
            ) : null}

            {!statusQuery.isLoading && playbackUrl && status?.item?.mediaType === 'audio' ? (
              <div className="flex h-full min-h-[220px] flex-col justify-between rounded-[12px] border border-white/10 bg-panelAlt/45 p-4">
                <div className="flex items-center gap-2 text-[rgb(var(--color-text-primary))]">
                  <Volume2 className="h-4 w-4 text-brand" />
                  <p className="font-semibold">{status.item.title}</p>
                </div>
                <audio key={playbackUrl} className="w-full" controls autoPlay={status.state === 'live'} src={playbackUrl} />
              </div>
            ) : null}

            {!statusQuery.isLoading && !playbackUrl ? <EmptyState title="No active stream" description="Go live to preview output." /> : null}
          </div>

          <div className="mt-4 grid gap-3 text-sm text-[rgb(var(--color-text-secondary))] sm:grid-cols-2">
            <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Source</span><p className="mt-1 truncate text-[rgb(var(--color-text-primary))]">{status?.item?.source ?? 'None'}</p></div>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Audience</span><p className="mt-1 text-[rgb(var(--color-text-primary))]">{status?.metadata.audience ?? 'noc-operators'}</p></div>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Session</span><p className="mt-1 text-[rgb(var(--color-text-primary))]">{status?.sessionId ?? 'Inactive'}</p></div>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Started</span><p className="mt-1 text-[rgb(var(--color-text-primary))]">{status?.lastStartedAt ? formatRelativeTime(status.lastStartedAt) : 'Idle'}</p></div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Media Library</h3>
            <FolderTree className="h-4 w-4 text-brand" />
          </div>

          <FileBreadcrumbs items={libraryQuery.data?.breadcrumbs ?? []} onNavigate={setLibraryPath} />

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="glass-chip">{stats.directories} folders</span>
            <span className="glass-chip">{stats.files} files</span>
            <span className="glass-chip">{stats.audio} audio</span>
            <span className="glass-chip">{stats.video} video</span>
          </div>

          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--color-text-muted))]" />
            <Input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} className="pl-10" placeholder="Filter" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Folders</p>
              {directories.length ? directories.map((entry) => (
                <button key={entry.relativePath} type="button" onClick={() => selectEntry(entry)} className="m3-pressable [--state-layer-color:rgb(var(--color-brand))] flex w-full items-center justify-between rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-[rgb(var(--color-text-primary))]">
                  <span>{entry.name}</span>
                  <FolderTree className="h-4 w-4 text-brand" />
                </button>
              )) : <p className="text-sm text-[rgb(var(--color-text-muted))]">No folders</p>}
            </div>

            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Files</p>
              {libraryQuery.isLoading ? <LoadingSkeleton className="h-32 w-full" /> : null}
              {libraryQuery.isError ? <ErrorState title="Library unavailable" message={(libraryQuery.error as Error).message} /> : null}
              {!libraryQuery.isLoading && !libraryQuery.isError && !files.length ? <EmptyState title="No files" description="Add media files." /> : null}
              {files.map((entry) => (
                <button key={entry.relativePath} type="button" onClick={() => selectEntry(entry)} className={cn('m3-pressable [--state-layer-color:rgb(var(--color-brand))] w-full rounded-[12px] border px-3 py-2 text-left', selectedFile?.relativePath === entry.relativePath ? 'border-brand/30 bg-brand/10' : 'border-white/10 bg-white/[0.04]')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--color-text-primary))]">{entry.name}</p>
                    {entry.mediaType === 'audio' ? <Volume2 className="h-4 w-4 text-brand" /> : <Video className="h-4 w-4 text-brand" />}
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">{formatBytes(entry.size)} • {formatTimestamp(entry.modifiedAt)}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <h3 className="mb-4 text-lg font-bold text-[rgb(var(--color-text-primary))]">Selected</h3>

          {selectedFile ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Name</span><p className="mt-1 text-[rgb(var(--color-text-primary))]">{selectedFile.name}</p></div>
              <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Path</span><p className="mt-1 truncate text-[rgb(var(--color-text-primary))]">{selectedFile.relativePath}</p></div>
              <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3"><span className="text-[rgb(var(--color-text-muted))]">Size</span><p className="mt-1 text-[rgb(var(--color-text-primary))]">{formatBytes(selectedFile.size)}</p></div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => void onCopy('Path', selectedFile.relativePath)}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={submit} disabled={busy || !source.trim()}>
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title="No selection" description="Pick a file from library." />
          )}

          <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm text-[rgb(var(--color-text-secondary))]">
            Source: <span className="text-[rgb(var(--color-text-primary))]">{activeSource || 'None'}</span>
          </div>
        </Card>
      </section>
    </div>
  );
}
