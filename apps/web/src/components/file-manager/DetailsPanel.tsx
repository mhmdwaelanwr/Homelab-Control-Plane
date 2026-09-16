import { FileText, FolderOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatBytes, formatTimestamp } from '@/lib/utils';
import { useI18n } from '@/providers/I18nProvider';
import type { FileEntry } from '@/types/api';

type DetailsPanelProps = {
  entry: FileEntry | null;
};

export function DetailsPanel({ entry }: DetailsPanelProps) {
  const { t } = useI18n();

  return (
    <Card className="h-full bg-gradient-to-b from-panelAlt/70 to-panel/90">
      <h3 className="font-display text-lg text-[rgb(var(--color-text-primary))]">{t('page.files.details.title')}</h3>
      {entry ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/6 bg-panelAlt/55 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-[rgb(var(--color-text-primary))]">
              {entry.kind === 'directory' ? <FolderOpen className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-info" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-[rgb(var(--color-text-primary))]">{entry.name}</p>
              <p className="truncate text-xs text-[rgb(var(--color-text-secondary))]">{entry.relativePath}</p>
            </div>
            <Badge variant="neutral">{entry.kind === 'directory' ? t('files.kind.directory') : t('files.kind.file')}</Badge>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('files.table.name')}</p>
            <p className="text-[rgb(var(--color-text-primary))]">{entry.name}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('files.table.type')}</p>
            <p className="text-[rgb(var(--color-text-primary))]">{entry.kind === 'directory' ? t('files.kind.directory') : t('files.kind.file')}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('page.files.details.permissions')}</p>
            <p className="text-[rgb(var(--color-text-primary))]">{entry.permissions}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('files.table.size')}</p>
            <p className="text-[rgb(var(--color-text-primary))]">{entry.kind === 'file' ? formatBytes(entry.size) : t('files.kind.directory')}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('files.table.modified')}</p>
            <p className="text-[rgb(var(--color-text-primary))]">{formatTimestamp(entry.modifiedAt)}</p>
          </div>
          <div>
            <p className="text-[rgb(var(--color-text-muted))]">{t('page.files.details.path')}</p>
            <p className="break-all text-[rgb(var(--color-text-primary))]">{entry.relativePath}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-[rgb(var(--color-text-muted))]">
          {t('page.files.details.empty')}
        </div>
      )}
    </Card>
  );
}
