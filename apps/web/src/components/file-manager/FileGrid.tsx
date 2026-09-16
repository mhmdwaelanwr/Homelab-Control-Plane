import { Copy, Download, FileText, Folder, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatBytes, formatTimestamp } from '@/lib/utils';
import type { FileEntry } from '@/types/api';

type FileGridProps = {
  entries: FileEntry[];
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
  onOpen: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onRename?: (entry: FileEntry) => void;
  onCopyPath?: (entry: FileEntry) => void;
};

export function FileGrid({ entries, selectedPath, onSelect, onOpen, onDownload, onRename, onCopyPath }: FileGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {entries.map((entry) => (
        <Card
          key={entry.relativePath}
          role="button"
          tabIndex={0}
          className={cn(
            'm3-pressable [--state-layer-color:rgb(var(--color-brand))] cursor-pointer overflow-hidden bg-gradient-to-br from-panelAlt/72 to-panel/92 transition hover:border-brand/30',
            selectedPath === entry.relativePath && 'border-brand/50 ring-1 ring-brand/20',
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
          <div className="mb-4 flex items-start justify-between">
            {entry.kind === 'directory' ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12">
                <Folder className="h-6 w-6 text-accent" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/12">
                <FileText className="h-6 w-6 text-info" />
              </div>
            )}
            <div className="flex items-center gap-1">
              {entry.kind === 'file' ? (
                <Button variant="ghost" size="icon" onClick={(event) => {
                  event.stopPropagation();
                  onDownload(entry);
                }}>
                  <Download className="h-4 w-4" />
                </Button>
              ) : null}
              {onCopyPath ? (
                <Button variant="ghost" size="icon" onClick={(event) => {
                  event.stopPropagation();
                  onCopyPath(entry);
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
              {onRename ? (
                <Button variant="ghost" size="icon" onClick={(event) => {
                  event.stopPropagation();
                  onRename(entry);
                }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
          <h4 className="truncate text-base font-semibold text-[rgb(var(--color-text-primary))]">{entry.name}</h4>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge variant="neutral">{entry.kind === 'file' ? entry.extension || 'file' : 'directory'}</Badge>
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">{entry.kind === 'file' ? formatBytes(entry.size) : 'Folder'}</p>
          </div>
          <p className="mt-3 text-sm text-[rgb(var(--color-text-secondary))]">{formatTimestamp(entry.modifiedAt)}</p>
          <p className="mt-1 truncate text-xs text-[rgb(var(--color-text-muted))]">{entry.relativePath}</p>
        </Card>
      ))}
    </div>
  );
}
