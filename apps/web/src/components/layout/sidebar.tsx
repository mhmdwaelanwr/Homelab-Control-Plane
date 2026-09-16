import { MenuSquare, MonitorPlay, Sparkles, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useI18n } from '@/providers/I18nProvider';
import { prefetchRoute } from '@/router/prefetch';
import { navigation } from './navigation';

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { layoutMode } = useTheme();
  const { connected, data } = useLiveMetrics();
  const { t } = useI18n();

  const sidebarContent = (
    <>
      <div className="mb-10 flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand/20 bg-brand/12 text-brand shadow-[0_10px_24px_rgba(var(--color-brand-rgb),0.2)]">
            <MonitorPlay className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-[1.72rem] font-bold leading-none tracking-[-0.015em] text-[rgb(var(--color-text-primary))]">HELM</h1>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgb(var(--color-text-muted))]">NOC Deck</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="m3-pressable [--state-layer-color:rgb(var(--color-text-primary))] flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-8 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--color-text-muted))]">{t('sidebar.mission_status')}</p>
          <span className={cn('h-2.5 w-2.5 rounded-full', connected ? 'bg-success shadow-[0_0_12px_rgba(var(--color-success),0.6)]' : 'bg-danger')} />
        </div>
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-[rgb(var(--color-text-primary))]">
          {data?.network.hostname ?? 'Host'}
        </p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--color-text-secondary))]">
          {data?.network.localIp ?? 'No address'}
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--color-text-muted))]">{t('sidebar.infrastructure')}</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onMouseEnter={() => void prefetchRoute(item.to)}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group nav-rail-link',
                  isActive
                    ? 'nav-rail-link-active'
                    : 'text-[rgb(var(--color-text-secondary))] hover:bg-white/[0.05] hover:text-[rgb(var(--color-text-primary))]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" /> : null}
                  <div
                    className={cn(
                      'nav-rail-icon',
                      isActive ? 'border-brand/20 bg-brand/10' : 'border-white/6 bg-white/[0.04]',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-brand' : 'text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-text-primary))]',
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">{t(item.labelKey)}</p>
                    <p className="truncate pt-0.5 text-[11px] font-medium text-[rgb(var(--color-text-muted))]">{t(item.descriptionKey)}</p>
                  </div>
                  {isActive ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <MenuSquare className="h-4 w-4" />
                    </div>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="premium-card border-brand/10 bg-gradient-to-br from-brand/10 to-transparent p-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-brand">
            <Sparkles className="h-4 w-4" />
            Link
          </div>
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-[rgb(var(--color-text-secondary))]">
            {data?.network.interfaces.length ?? 0} active interfaces
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={cn(
                'h-full rounded-full shadow-[0_0_10px_rgba(var(--color-brand-rgb),0.45)]',
                connected ? 'w-[88%] bg-brand' : 'w-[38%] bg-warning',
              )}
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          'glass-chrome hidden shrink-0 rounded-[24px] px-6 py-7 transition-all duration-300 lg:my-3 lg:ml-3 lg:flex lg:flex-col',
          layoutMode === 'desktop' ? 'w-80' : 'w-72',
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition duration-300 lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'glass-chrome fixed inset-y-3 left-3 z-50 flex w-[86vw] max-w-sm flex-col rounded-[24px] px-5 py-6 transition duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
