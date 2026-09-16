import { Bell, LogOut, Menu, MoonStar, Search, SunMedium, TerminalSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useI18n } from '@/providers/I18nProvider';
import { getRouteMeta } from './navigation';

type TopbarProps = {
  onToggleNavigation: () => void;
};

export function Topbar({ onToggleNavigation }: TopbarProps) {
  const { logout, user } = useAuth();
  const { data, connected, lastUpdated } = useLiveMetrics();
  const { items, unreadCount, panelOpen, setPanelOpen, markAllRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const { openCommandPalette, toggleTerminal } = useWorkspace();
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const route = getRouteMeta(location.pathname);
  const RouteIcon = route.icon;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [setPanelOpen]);

  const themeModes: Array<{
    id: 'day' | 'night';
    icon: typeof SunMedium;
    label: string;
  }> = [
    { id: 'day', icon: SunMedium, label: t('theme.day') },
    { id: 'night', icon: MoonStar, label: t('theme.night') },
  ];

  return (
    <header className="glass-chrome sticky top-0 z-30 mx-3 mt-3 flex flex-wrap items-center justify-between gap-4 rounded-[24px] px-4 py-4 sm:mx-4 sm:px-6 xl:mx-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleNavigation}
          className="m3-pressable [--state-layer-color:rgb(var(--color-text-primary))] flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] text-[rgb(var(--color-text-primary))] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-brand/10 text-brand sm:flex">
          <RouteIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-[1.1rem] font-bold leading-tight tracking-[-0.01em] text-[rgb(var(--color-text-primary))] sm:text-[1.2rem]">{t(route.labelKey)}</h1>
            <div className={cn('h-2 w-2 rounded-full', connected ? 'bg-success shadow-[0_0_10px_rgba(var(--color-success),0.55)]' : 'bg-danger')} />
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">
            {connected ? 'NOC telemetry live' : 'NOC polling mode'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-[rgb(var(--color-text-secondary))] xl:flex">
          <Badge variant={data?.overview.systemStatus ?? 'neutral'}>{data?.overview.systemStatus ?? 'waiting'}</Badge>
          <span className="text-[rgb(var(--color-text-muted))]">{lastUpdated ? formatRelativeTime(lastUpdated) : 'telemetry pending'}</span>
        </div>

        <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] p-1 md:flex">
          {themeModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTheme(mode.id)}
                className={cn(
                  'm3-pressable flex h-9 w-9 items-center justify-center rounded-lg [--state-layer-color:rgb(var(--color-text-primary))]',
                  theme === mode.id
                    ? 'bg-accent text-canvas shadow-[0_12px_24px_rgba(0,0,0,0.16)]'
                    : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-primary))]'
                )}
                title={mode.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleTerminal}
          className="m3-pressable [--state-layer-color:rgb(var(--color-text-primary))] hidden h-11 items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] md:flex"
        >
          <TerminalSquare className="h-4 w-4" />
          Term
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-[rgb(var(--color-text-muted))]">
            Ctrl `
          </span>
        </button>

        <button
          type="button"
          onClick={openCommandPalette}
          className="m3-pressable [--state-layer-color:rgb(var(--color-text-primary))] hidden h-11 items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] md:flex"
        >
          <Search className="h-4 w-4" />
          Cmd
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-[rgb(var(--color-text-muted))]">
            Ctrl K
          </span>
        </button>

        <div className="relative" ref={panelRef}>
          <button
            className="m3-pressable [--state-layer-color:rgb(var(--color-text-primary))] flex h-11 items-center gap-2.5 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]"
            onClick={() => setPanelOpen(!panelOpen)}
            type="button"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <div className="animate-in absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(380px,calc(100vw-2rem))] premium-card p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-[rgb(var(--color-text-primary))]">{t('topbar.activity_log')}</h3>
                <button
                  type="button"
                  className="m3-pressable [--state-layer-color:rgb(var(--color-brand))] rounded-[8px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))] hover:text-brand"
                  onClick={markAllRead}
                >
                  {t('topbar.mark_read')}
                </button>
              </div>

              <div className="max-h-[350px] space-y-3 overflow-y-auto pr-1">
                {items.length ? (
                  items.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <Badge variant={item.level === 'info' ? 'healthy' : item.level}>{item.source}</Badge>
                        <span className="text-[10px] font-mono text-[rgb(var(--color-text-muted))]">{formatRelativeTime(item.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))]">{item.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--color-text-muted))]">
                    {t('topbar.no_events')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-white/8 pl-3 sm:gap-4 sm:pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold tracking-[-0.01em] text-[rgb(var(--color-text-primary))]">{user?.username ?? 'root'}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">{user?.role ?? 'admin'}</p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="m3-pressable [--state-layer-color:rgb(255_255_255)] flex h-11 w-11 items-center justify-center rounded-[12px] bg-danger/12 text-danger"
            title={t('topbar.terminate_session')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
