import { Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useI18n } from '@/providers/I18nProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { navigation } from './navigation';

const dockItems = navigation.filter((item) => ['/', '/files', '/screen', '/settings'].includes(item.to));

export function MobileDock() {
  const { openCommandPalette } = useWorkspace();
  const { unreadCount } = useNotifications();
  const { t, dir } = useI18n();

  return (
    <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div className="grid grid-cols-5 items-center gap-2 rounded-[28px] border border-white/10 bg-panel/90 p-2 shadow-[0_24px_50px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        {dockItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-[22px] px-2 py-2.5 text-center transition',
                  isActive ? 'bg-brand/12 text-brand' : 'text-[rgb(var(--color-text-secondary))]',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em]">{t(item.shortLabelKey)}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={openCommandPalette}
          className="relative flex flex-col items-center gap-1 rounded-[22px] px-2 py-2.5 text-[rgb(var(--color-text-secondary))] transition hover:bg-white/[0.05] hover:text-[rgb(var(--color-text-primary))]"
        >
          <Search className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{t('mobile.menu')}</span>
          {unreadCount ? (
            <span className={cn('absolute top-2 h-2 w-2 rounded-full bg-brand', dir === 'rtl' ? 'left-3' : 'right-3')} />
          ) : null}
        </button>
      </div>
    </div>
  );
}
