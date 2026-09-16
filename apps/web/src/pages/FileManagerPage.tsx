import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Download,
  FolderPlus,
  LayoutGrid,
  List,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { DetailsPanel } from '@/components/file-manager/DetailsPanel';
import { FileBreadcrumbs } from '@/components/file-manager/FileBreadcrumbs';
import { FileGrid } from '@/components/file-manager/FileGrid';
import { FileTable } from '@/components/file-manager/FileTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, copyToClipboard, formatBytes, formatTimestamp } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useToast } from '@/providers/ToastProvider';
import { createFolder, deleteEntry, downloadFile, listFiles, renameEntry, uploadFile } from '@/services/files';
import type { FileEntry } from '@/types/api';

type ViewMode = 'table' | 'grid';
type SortKey = 'name' | 'modified' | 'size' | 'type';
type DialogMode = 'create' | 'rename' | 'delete' | null;

function sortEntries(entries: FileEntry[], sortKey: SortKey) {
  return [...entries].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'directory' ? -1 : 1;
    }

    if (sortKey === 'modified') {
      return right.modifiedAt - left.modifiedAt;
    }

    if (sortKey === 'size') {
      return right.size - left.size || left.name.localeCompare(right.name);
    }

    if (sortKey === 'type') {
      return (left.extension || left.kind).localeCompare(right.extension || right.kind) || left.name.localeCompare(right.name);
    }

    return left.name.localeCompare(right.name);
  });
}

export function FileManagerPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { pushToast } = useToast();
  const { t } = useI18n();
  const { data: liveMetrics } = useLiveMetrics();
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [draftName, setDraftName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [actionBusyLabel, setActionBusyLabel] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filesQuery = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => listFiles(currentPath),
  });

  const entries = filesQuery.data?.entries ?? [];
  const breadcrumbs = filesQuery.data?.breadcrumbs ?? [{ label: t('page.files.breadcrumb.root'), path: '/' }];
  const filteredEntries = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase();
    const nextEntries = normalizedQuery
      ? entries.filter((entry) =>
          [entry.name, entry.relativePath, entry.extension, entry.kind].join(' ').toLowerCase().includes(normalizedQuery),
        )
      : entries;

    return sortEntries(nextEntries, sortKey);
  }, [deferredSearch, entries, sortKey]);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }

    const updatedEntry = entries.find((entry) => entry.relativePath === selectedEntry.relativePath);
    setSelectedEntry(updatedEntry ?? null);
  }, [entries, selectedEntry]);

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => createFolder(currentPath, folderName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      pushToast({
        title: t('page.files.toast.folder_created.title'),
        description: t('page.files.toast.folder_created.desc', { name: draftName, path: currentPath }),
        variant: 'success',
      });
      setDialogMode(null);
      setDraftName('');
    },
    onError: (error) => {
      pushToast({ title: t('page.files.toast.create_failed.title'), description: (error as Error).message, variant: 'danger' });
    },
  });

  const renameEntryMutation = useMutation({
    mutationFn: async ({ path, nextName }: { path: string; nextName: string }) => renameEntry(path, nextName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      pushToast({
        title: t('page.files.toast.entry_renamed.title'),
        description: t('page.files.toast.entry_renamed.desc'),
        variant: 'success',
      });
      setDialogMode(null);
      setDraftName('');
    },
    onError: (error) => {
      pushToast({ title: t('page.files.toast.rename_failed.title'), description: (error as Error).message, variant: 'danger' });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (path: string) => deleteEntry(path),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      pushToast({
        title: t('page.files.toast.entry_deleted.title'),
        description: t('page.files.toast.entry_deleted.desc'),
        variant: 'warning',
      });
      setSelectedEntry(null);
      setDialogMode(null);
    },
    onError: (error) => {
      pushToast({ title: t('page.files.toast.delete_failed.title'), description: (error as Error).message, variant: 'danger' });
    },
  });

  async function uploadSelectedFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    setActionBusyLabel(
      files.length === 1
        ? t('page.files.busy.uploading_one', { name: files[0]?.name ?? '' })
        : t('page.files.busy.uploading_many', { count: files.length }),
    );

    try {
      for (const file of files) {
        await uploadFile(currentPath, file);
      }

      await queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      pushToast({
        title: files.length === 1 ? t('page.files.toast.upload_complete_one.title') : t('page.files.toast.upload_complete_many.title'),
        description:
          files.length === 1
            ? t('page.files.toast.upload_complete_one.desc', { name: files[0]?.name ?? '' })
            : t('page.files.toast.upload_complete_many.desc', { count: files.length }),
        variant: 'success',
      });
    } catch (error) {
      const fallback = t('page.files.toast.upload_failed.desc');
      const message = error instanceof Error ? error.message : fallback;
      pushToast({
        title: t('page.files.toast.upload_failed.title'),
        description: message,
        variant: 'danger',
      });
    } finally {
      setActionBusyLabel(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDownload(entry: FileEntry) {
    if (entry.kind !== 'file') {
      return;
    }

    try {
      setActionBusyLabel(t('page.files.busy.downloading', { name: entry.name }));
      await downloadFile(entry.relativePath);
      pushToast({
        title: t('page.files.toast.download_started.title'),
        description: t('page.files.toast.download_started.desc', { name: entry.name }),
        variant: 'success',
      });
    } catch (error) {
      pushToast({ title: t('page.files.toast.download_failed.title'), description: (error as Error).message, variant: 'danger' });
    } finally {
      setActionBusyLabel(null);
    }
  }

  async function handleCopyPath(entry: FileEntry) {
    try {
      await copyToClipboard(entry.relativePath);
      pushToast({
        title: t('page.files.toast.path_copied.title'),
        description: t('page.files.toast.path_copied.desc', { path: entry.relativePath }),
        variant: 'success',
      });
    } catch (error) {
      pushToast({ title: t('page.files.toast.copy_failed.title'), description: (error as Error).message, variant: 'danger' });
    }
  }

  function handleOpen(entry: FileEntry) {
    if (entry.kind === 'directory') {
      startTransition(() => {
        setCurrentPath(entry.relativePath);
        setSelectedEntry(null);
      });
      return;
    }

    setSelectedEntry(entry);
  }

  function openRenameDialog(entry: FileEntry) {
    setSelectedEntry(entry);
    setDraftName(entry.name);
    setDialogMode('rename');
  }

  function openDeleteDialog(entry: FileEntry) {
    setSelectedEntry(entry);
    setDialogMode('delete');
  }

  function submitDialog() {
    if (dialogMode === 'create') {
      if (!draftName.trim()) {
        return;
      }

      createFolderMutation.mutate(draftName.trim());
      return;
    }

    if (dialogMode === 'rename' && selectedEntry) {
      if (!draftName.trim()) {
        return;
      }

      renameEntryMutation.mutate({ path: selectedEntry.relativePath, nextName: draftName.trim() });
      return;
    }

    if (dialogMode === 'delete' && selectedEntry) {
      deleteEntryMutation.mutate(selectedEntry.relativePath);
    }
  }

  const directoryCount = filteredEntries.filter((entry) => entry.kind === 'directory').length;
  const fileCount = filteredEntries.filter((entry) => entry.kind === 'file').length;
  const storageUsage = liveMetrics?.overview.storageUsage ?? 0;
  const storageUsed = liveMetrics?.storage.used ?? null;
  const storageTotal = liveMetrics?.storage.total ?? null;
  const mutationBusy =
    createFolderMutation.isPending || renameEntryMutation.isPending || deleteEntryMutation.isPending;
  const sortLabel =
    sortKey === 'name'
      ? t('files.table.name')
      : sortKey === 'modified'
        ? t('files.table.modified')
        : sortKey === 'size'
          ? t('files.table.size')
          : t('files.table.type');
  const viewLabel = viewMode === 'table' ? t('page.files.view.table') : t('page.files.view.grid');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Linux Filesystem"
        title="Server File Operations"
        description="Browse, inspect, execute safely."
        actions={
          <>
            <Badge variant="neutral">{filesQuery.data?.currentPath ?? currentPath}</Badge>
            <Badge variant="healthy">{t('page.files.badge.visible_entries', { count: filteredEntries.length })}</Badge>
          </>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[1.35fr,0.95fr]">
        <Card className="dashboard-mesh p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="section-kicker">Filesystem Scope</span>
              <h3 className="mt-5 font-display text-3xl leading-tight text-[rgb(var(--color-text-primary))]">Active Linux Path</h3>
              <p className="mt-3 text-sm text-[rgb(var(--color-text-secondary))]">{filesQuery.data?.currentPath ?? currentPath}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Folders</p>
                <p className="mt-3 text-2xl font-black text-[rgb(var(--color-text-primary))]">{directoryCount}</p>
                <p className="mt-1 text-sm text-[rgb(var(--color-text-secondary))]">In scope</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Files</p>
                <p className="mt-3 text-2xl font-black text-[rgb(var(--color-text-primary))]">{fileCount}</p>
                <p className="mt-1 text-sm text-[rgb(var(--color-text-secondary))]">
                  {selectedEntry ? formatTimestamp(selectedEntry.modifiedAt) : 'No inode selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">{t('page.files.controls.title')}</p>
                <Badge variant="neutral">{t('page.files.controls.drag_drop')}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr,160px,120px]">
                <div className="icon-field">
                  <Search className="icon-field__icon h-4 w-4 text-[rgb(var(--color-text-muted))]" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('page.files.search.placeholder')}
                    className="icon-field__input"
                  />
                </div>
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  className="h-11 rounded-2xl border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
                >
                  <option value="name">{t('page.files.sort.name')}</option>
                  <option value="modified">{t('page.files.sort.modified')}</option>
                  <option value="size">{t('page.files.sort.size')}</option>
                  <option value="type">{t('page.files.sort.type')}</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} size="icon" onClick={() => setViewMode('table')}>
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'grid' ? 'primary' : 'secondary'} size="icon" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Path State</p>
                <Button variant="ghost" size="icon" onClick={() => void filesQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">{filesQuery.data?.currentPath ?? currentPath}</p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-secondary))]">Sync, inspect, then apply file actions.</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="premium-card p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Storage</p>
                <h3 className="mt-2 text-2xl font-black text-[rgb(var(--color-text-primary))]">Usage</h3>
              </div>
              <Badge variant={storageUsage >= 90 ? 'critical' : storageUsage >= 75 ? 'warning' : 'healthy'}>
                {storageUsage.toFixed(1)}%
              </Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/6">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-info" style={{ width: `${storageUsage}%` }} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-[rgb(var(--color-text-secondary))]">
              <span>
                {t('page.files.storage_posture.used', { used: storageUsed != null ? formatBytes(storageUsed) : t('common.loading') })}
              </span>
              <span>
                {t('page.files.storage_posture.total', { total: storageTotal != null ? formatBytes(storageTotal) : t('common.loading') })}
              </span>
            </div>
          </Card>

          <Card className="premium-card p-7">
            <div className="mb-4 flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => setDialogMode('create')}>
                <FolderPlus className="h-4 w-4" />
                {t('page.files.actions.new_folder')}
              </Button>
              <Button variant="secondary" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {t('page.files.actions.upload_files')}
              </Button>
            </div>
            <p className="text-sm leading-6 text-[rgb(var(--color-text-secondary))]">Drag and drop supports direct upload to active path.</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void uploadSelectedFiles(Array.from(event.target.files ?? []))}
            />
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <Card
          className={cn(
            'premium-card min-h-[560px] p-0 transition',
            dragActive && 'border-brand/35 shadow-[0_30px_100px_rgba(var(--color-brand-rgb),0.18)]',
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
              return;
            }
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void uploadSelectedFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <FileBreadcrumbs
              items={breadcrumbs}
              onNavigate={(path) =>
                startTransition(() => {
                  setCurrentPath(path);
                  setSelectedEntry(null);
                })
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{sortLabel}</Badge>
              <Badge variant="neutral">{viewLabel}</Badge>
            </div>
          </div>

          <div className="relative min-h-[480px] p-4 sm:p-5">
            {dragActive ? (
              <div className="absolute inset-4 z-10 flex items-center justify-center rounded-[28px] border-2 border-dashed border-brand/35 bg-brand/8 text-center">
                <div>
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">
                    {t('page.files.drag_overlay.title', { path: currentPath })}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--color-text-secondary))]">{t('page.files.drag_overlay.desc')}</p>
                </div>
              </div>
            ) : null}

            {filesQuery.isLoading ? <LoadingSkeleton className="h-[460px] w-full" /> : null}
            {filesQuery.isError ? (
              <ErrorState title={t('page.files.error.title')} message={(filesQuery.error as Error).message} onRetry={() => void filesQuery.refetch()} />
            ) : null}
            {!filesQuery.isLoading && !filesQuery.isError && !filteredEntries.length ? (
              <EmptyState
                title={entries.length ? t('page.files.empty.no_matches.title') : t('page.files.empty.folder_empty.title')}
                description={
                  entries.length
                    ? t('page.files.empty.no_matches.desc')
                    : t('page.files.empty.folder_empty.desc')
                }
              />
            ) : null}
            {!filesQuery.isLoading && !filesQuery.isError && filteredEntries.length ? (
              viewMode === 'table' ? (
                <FileTable
                  entries={filteredEntries}
                  selectedPath={selectedEntry?.relativePath ?? null}
                  sortLabel={sortKey}
                  onSelect={setSelectedEntry}
                  onOpen={handleOpen}
                  onDelete={openDeleteDialog}
                  onDownload={(entry) => void handleDownload(entry)}
                  onRename={openRenameDialog}
                  onCopyPath={(entry) => void handleCopyPath(entry)}
                />
              ) : (
                <FileGrid
                  entries={filteredEntries}
                  selectedPath={selectedEntry?.relativePath ?? null}
                  onSelect={setSelectedEntry}
                  onOpen={handleOpen}
                  onDownload={(entry) => void handleDownload(entry)}
                  onRename={openRenameDialog}
                  onCopyPath={(entry) => void handleCopyPath(entry)}
                />
              )
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <DetailsPanel entry={selectedEntry} />

          <Card className="premium-card p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">{t('page.files.selected_actions.title')}</p>
            <div className="mt-4 grid gap-3">
              <Button variant="secondary" className="justify-start gap-2" disabled={!selectedEntry} onClick={() => selectedEntry && void handleCopyPath(selectedEntry)}>
                <Copy className="h-4 w-4" />
                {t('page.files.selected_actions.copy_path')}
              </Button>
              <Button variant="secondary" className="justify-start gap-2" disabled={!selectedEntry} onClick={() => selectedEntry && openRenameDialog(selectedEntry)}>
                <Pencil className="h-4 w-4" />
                {t('page.files.selected_actions.rename')}
              </Button>
              <Button variant="secondary" className="justify-start gap-2" disabled={!selectedEntry || selectedEntry.kind !== 'file'} onClick={() => selectedEntry && void handleDownload(selectedEntry)}>
                <Download className="h-4 w-4" />
                {t('page.files.selected_actions.download')}
              </Button>
              <Button variant="danger" className="justify-start gap-2" disabled={!selectedEntry} onClick={() => selectedEntry && openDeleteDialog(selectedEntry)}>
                <Trash2 className="h-4 w-4" />
                {t('page.files.selected_actions.delete')}
              </Button>
            </div>
          </Card>

          <Card className="premium-card p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">Runbook Notes</p>
            <div className="mt-4 space-y-3 text-sm text-[rgb(var(--color-text-secondary))]">
              <p>Use rename and delete carefully on production paths.</p>
            </div>
            {actionBusyLabel ? (
              <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-sm text-[rgb(var(--color-text-primary))]">
                {actionBusyLabel}
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <Dialog
        open={dialogMode !== null}
        onClose={() => {
          if (!mutationBusy) {
            setDialogMode(null);
          }
        }}
        title={
          dialogMode === 'create'
            ? t('page.files.dialog.create.title')
            : dialogMode === 'rename'
              ? t('page.files.dialog.rename.title')
              : t('page.files.dialog.delete.title')
        }
        description={
          dialogMode === 'create'
            ? t('page.files.dialog.create.desc', { path: currentPath })
            : dialogMode === 'rename'
              ? t('page.files.dialog.rename.desc', {
                  name: selectedEntry?.name ?? t('page.files.dialog.selected_entry_fallback'),
                })
              : t('page.files.dialog.delete.desc', {
                  name: selectedEntry?.name ?? t('page.files.dialog.selected_entry_fallback'),
                })
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)} disabled={mutationBusy}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={dialogMode === 'delete' ? 'danger' : 'primary'}
              onClick={submitDialog}
              disabled={mutationBusy || (dialogMode !== 'delete' && !draftName.trim())}
            >
              {dialogMode === 'create'
                ? t('page.files.dialog.create.primary')
                : dialogMode === 'rename'
                  ? t('page.files.dialog.rename.primary')
                  : t('page.files.dialog.delete.primary')}
            </Button>
          </>
        }
      >
        {dialogMode === 'delete' ? (
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-[rgb(var(--color-text-primary))]">
            {selectedEntry?.kind === 'directory'
              ? t('page.files.dialog.delete.warning_directory')
              : t('page.files.dialog.delete.warning_file')}
          </div>
        ) : (
          <Input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder={
              dialogMode === 'create'
                ? t('page.files.dialog.input_placeholder.create')
                : selectedEntry?.name ?? t('page.files.dialog.input_placeholder.rename')
            }
            autoFocus
          />
        )}
      </Dialog>
    </div>
  );
}
