import { Command, CornerDownLeft, MoveVertical, Search, X } from 'lucide-react';

import { Dialog } from '@/components/ui/dialog';
import type { TranslationKey } from '@/lib/i18n';
import { useI18n } from '@/providers/I18nProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

const shortcuts: Array<{
  titleKey: TranslationKey;
  keys: string;
  descriptionKey: TranslationKey;
  icon: typeof Command;
}> = [
  {
    titleKey: 'shortcuts.command_menu.title',
    keys: 'Ctrl/Cmd + K',
    descriptionKey: 'shortcuts.command_menu.desc',
    icon: Command,
  },
  {
    titleKey: 'shortcuts.guide.title',
    keys: '?',
    descriptionKey: 'shortcuts.guide.desc',
    icon: Search,
  },
  {
    titleKey: 'shortcuts.run.title',
    keys: 'Enter',
    descriptionKey: 'shortcuts.run.desc',
    icon: CornerDownLeft,
  },
  {
    titleKey: 'shortcuts.move.title',
    keys: 'Arrow Up / Down',
    descriptionKey: 'shortcuts.move.desc',
    icon: MoveVertical,
  },
  {
    titleKey: 'shortcuts.close.title',
    keys: 'Esc',
    descriptionKey: 'shortcuts.close.desc',
    icon: X,
  },
];

export function KeyboardShortcutsDialog() {
  const { shortcutsOpen, closeShortcuts } = useWorkspace();
  const { t } = useI18n();

  return (
    <Dialog
      open={shortcutsOpen}
      onClose={closeShortcuts}
      title={t('shortcuts.dialog_title')}
      description={t('shortcuts.dialog_desc')}
    >
      <div className="space-y-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <div key={shortcut.titleKey} className="flex items-start gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold text-[rgb(var(--color-text-primary))]">{t(shortcut.titleKey)}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--color-text-muted))]">
                    {shortcut.keys}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-secondary))]">{t(shortcut.descriptionKey)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
