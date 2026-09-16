import { Copy, Download, FileCode, FileIcon, FileText, Folder, ImageIcon, Music, Pencil, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatBytes, formatTimestamp } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';
import type { FileEntry } from '@/types/api';

type FileTableProps = {
  entries: FileEntry[];
  selectedPath: string | null;
  sortLabel?: string;
  onSelect: (entry: FileEntry) => void;
  onOpen: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onRename?: (entry: FileEntry) => void;
  onCopyPath?: (entry: FileEntry) => void;
};

const getFileIcon = (entry: FileEntry) => {
  if (entry.kind === 'directory') return <Folder className='h-5 w-5 text-brand fill-brand/20' />;
  const ext = entry.extension?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <ImageIcon className='h-5 w-5 text-pink-500' />;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className='h-5 w-5 text-purple-500' />;
  if (['mp4', 'mkv', 'mov'].includes(ext)) return <Video className='h-5 w-5 text-orange-500' />;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'css', 'html'].includes(ext)) return <FileCode className='h-5 w-5 text-blue-500' />;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText className='h-5 w-5 text-emerald-500' />;
  return <FileIcon className='h-5 w-5 text-slate-400' />;
};

export function FileTable({
  entries,
  selectedPath,
  onSelect,
  onOpen,
  onDelete,
  onDownload,
  onRename,
  onCopyPath,
}: FileTableProps) {
  const { t, dir } = useI18n();

  return (
    <div className="w-full">
      <div className="hidden grid-cols-[1fr,140px,180px,100px] gap-4 border-b border-white/6 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))] md:grid">
        <div>{t('files.table.name')}</div>
        <div>{t('files.table.type')}</div>
        <div>{t('files.table.last_modified')}</div>
        <div className="text-end">{t('files.table.size')}</div>
      </div>

      <div className="flex flex-col">
        {entries.map((entry) => {
          const isSelected = selectedPath === entry.relativePath;
          return (
            <div
              key={entry.relativePath}
              role="button"
              tabIndex={0}
              className={cn(
                'm3-pressable [--state-layer-color:rgb(var(--color-brand))] group relative rounded-[24px] border border-transparent px-4 py-4 text-start md:grid md:grid-cols-[1fr,140px,180px,100px] md:items-center md:gap-4 md:rounded-none md:border-b md:px-6',
                isSelected ? 'border-brand/20 bg-brand/10' : 'hover:border-white/8 hover:bg-white/[0.04]',
              )}
              onClick={() => onSelect(entry)}
              onDoubleClick={() => onOpen(entry)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(entry);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(entry)}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[rgb(var(--color-text-primary))] group-hover:text-brand">
                    {entry.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[rgb(var(--color-text-muted))] md:hidden">
                    {entry.relativePath}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between md:mt-0 md:block">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))] md:hidden">{t('files.table.type')}</span>
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-secondary))]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-bold text-[rgb(var(--color-text-muted))]">
                    {entry.kind === 'directory' ? t('files.abbrev.dir') : t('files.abbrev.file')}
                  </div>
                  {entry.kind === 'directory' ? t('files.kind.directory') : entry.extension || t('files.kind.file')}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between md:mt-0">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))] md:hidden">{t('files.table.modified')}</span>
                <div className="text-xs text-[rgb(var(--color-text-secondary))]">{formatTimestamp(entry.modifiedAt)}</div>
              </div>

              <div className="mt-3 flex items-center justify-between md:mt-0 md:text-end">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))] md:hidden">{t('files.table.size')}</span>
                <div className="text-xs text-[rgb(var(--color-text-secondary))]">{entry.kind === 'file' ? formatBytes(entry.size) : '--'}</div>
              </div>

              <div
                className={cn(
                  'mt-4 flex items-center gap-1 md:absolute md:top-1/2 md:mt-0 md:-translate-y-1/2 md:opacity-0 md:transition-opacity md:group-hover:opacity-100',
                  dir === 'rtl' ? 'md:left-4' : 'md:right-4',
                )}
              >
                {entry.kind === 'file' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDownload(entry);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                ) : null}
                {onCopyPath ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCopyPath(entry);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                ) : null}
                {onRename ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRename(entry);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-danger/80 hover:bg-danger/10 hover:text-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(entry);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
