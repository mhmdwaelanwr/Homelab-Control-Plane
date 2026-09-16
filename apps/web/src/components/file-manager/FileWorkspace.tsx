import { DetailsPanel } from '@/components/file-manager/DetailsPanel';
import { FileGrid } from '@/components/file-manager/FileGrid';
import { FileTable } from '@/components/file-manager/FileTable';
import { ErrorState } from '@/components/state/ErrorState';
import { EmptyState } from '@/components/state/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { FileEntry } from '@/types/api';

type FileWorkspaceProps = {
  layoutMode: 'adaptive' | 'desktop';
  currentPath: string;
  directories: Array<{ label: string; path: string }>;
  entries: FileEntry[];
  selectedEntry: FileEntry | null;
  sortKey: string;
  actionBusyPath: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  viewMode: 'table' | 'grid';
  onRetry: () => void;
  onSetCurrentPath: (path: string) => void;
  onSelect: (entry: FileEntry) => void;
  onOpen: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
  onStartRename: () => void;
  onStartDelete: () => void;
};

export function FileWorkspace({
  layoutMode,
  currentPath,
  directories,
  entries,
  selectedEntry,
  sortKey,
  actionBusyPath,
  isLoading,
  errorMessage,
  viewMode,
  onRetry,
  onSetCurrentPath,
  onSelect,
  onOpen,
  onDelete,
  onDownload,
  onStartRename,
  onStartDelete,
}: FileWorkspaceProps) {
  return (
    <div className={`grid gap-6 ${layoutMode === 'desktop' ? 'xl:grid-cols-[260px,1fr,340px]' : 'xl:grid-cols-[220px,1fr,320px]'}`}>
      <div className="space-y-4">
        <Card className="bg-panelAlt/50 p-4">
          <h3 className="font-display text-lg text-white">Navigation</h3>
          <div className="mt-4 space-y-2">
            <Button className="w-full justify-start" variant={currentPath === '/' ? 'secondary' : 'ghost'} onClick={() => onSetCurrentPath('/')}>
              Root
            </Button>
            {directories.map((directory) => (
              <Button key={directory.path} className="w-full justify-start" variant={currentPath === directory.path ? 'secondary' : 'ghost'} onClick={() => onSetCurrentPath(directory.path)}>
                {directory.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="bg-panelAlt/50 p-4">
          <h3 className="font-display text-lg text-white">Workspace tips</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-400">
            <p>Double-click folders to open them quickly.</p>
            <p>Use grid view for browsing and table view for operational work.</p>
            <p>Keep the details rail open to inspect permissions before destructive actions.</p>
          </div>
        </Card>
      </div>

      <div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Spinner /></div>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : entries.length === 0 ? (
          <EmptyState title="No filesystem entries" description="No files or folders matched the current path filter." />
        ) : viewMode === 'table' ? (
          <FileTable
            entries={entries}
            selectedPath={selectedEntry?.relativePath ?? null}
            sortLabel={sortKey}
            onSelect={onSelect}
            onOpen={onOpen}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ) : (
          <FileGrid
            entries={entries}
            selectedPath={selectedEntry?.relativePath ?? null}
            onSelect={onSelect}
            onOpen={onOpen}
            onDownload={onDownload}
          />
        )}
      </div>

      <div className="space-y-4">
        <DetailsPanel entry={selectedEntry} />
        <Card className="bg-panelAlt/50">
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled={!selectedEntry} onClick={onStartRename}>
              Rename
            </Button>
            <Button variant="danger" className="flex-1" disabled={!selectedEntry} onClick={onStartDelete}>
              Delete
            </Button>
          </div>
        </Card>
        {actionBusyPath ? (
          <Card className="bg-panelAlt/50">
            <p className="text-sm text-slate-400">Executing file action for <span className="text-white">{actionBusyPath}</span></p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}