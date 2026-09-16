import {
  Bell,
  CheckCheck,
  Command,
  LayoutGrid,
  Languages,
  LogOut,
  MoonStar,
  Search,
  SunMedium,
  TerminalSquare,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useI18n } from '@/providers/I18nProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { prefetchRoute } from '@/router/prefetch';
import { getRouteMeta, navigation } from './navigation';

type CommandItem = {
  id: string;
  group: string;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  badge?: string;
  action: () => void | Promise<void>;
};

function routeForResource(resource: 'CPU' | 'Memory' | 'Storage' | undefined) {
  if (resource === 'CPU') return '/cpu';
  if (resource === 'Memory') return '/ram';
  if (resource === 'Storage') return '/storage';
  return '/';
}

export function CommandPalette() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { commandPaletteOpen, closeCommandPalette, openShortcuts, openTerminal } = useWorkspace();
  const { theme, setTheme, layoutMode, setLayoutMode } = useTheme();
  const { logout } = useAuth();
  const { unreadCount, setPanelOpen, markAllRead } = useNotifications();
  const { data } = useLiveMetrics();
  const { t, locale, setLocale } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const focusRoute = routeForResource(data?.insights.focus.resource);
  const focusMeta = getRouteMeta(focusRoute);

  const commands = useMemo<CommandItem[]>(() => {
    const groups = {
      navigate: t('cmd.group.navigate'),
      workspace: t('cmd.group.workspace'),
      appearance: t('cmd.group.appearance'),
      session: t('cmd.group.session'),
    };
    const focusLabel = t(focusMeta.labelKey);
    const nextLayoutMode = layoutMode === 'desktop' ? 'adaptive' : 'desktop';
    const nextLayoutLabel = nextLayoutMode === 'desktop' ? t('layout.desktop') : t('layout.adaptive');
    const nextLayoutDescription = nextLayoutMode === 'desktop' ? t('cmd.layout_desc_desktop') : t('cmd.layout_desc_adaptive');

    const navigationCommands = navigation.map((item) => ({
      id: `navigate:${item.to}`,
      group: groups.navigate,
      label: t('cmd.open_page', { page: t(item.labelKey) }),
      description: t(item.descriptionKey),
      keywords: [t(item.labelKey), t(item.shortLabelKey), item.to],
      icon: item.icon,
      action: () => navigate(item.to),
    }));

    return [
      ...navigationCommands,
      {
        id: 'workspace:focus-route',
        group: groups.workspace,
        label: t('cmd.jump_to_focus', { page: focusLabel }),
        description: data?.insights.focus.note ?? t('cmd.focus_fallback_desc'),
        keywords: ['focus', 'insight', focusLabel],
        icon: focusMeta.icon,
        badge: data?.insights.focus.resource,
        action: () => navigate(focusRoute),
      },
      {
        id: 'workspace:notifications',
        group: groups.workspace,
        label: t('cmd.open_notifications'),
        description: unreadCount ? t('cmd.notifications_desc_unread', { count: unreadCount }) : t('cmd.notifications_desc_empty'),
        keywords: ['alerts', 'notifications', 'activity'],
        icon: Bell,
        badge: unreadCount ? `${unreadCount}` : undefined,
        action: () => setPanelOpen(true),
      },
      {
        id: 'workspace:mark-read',
        group: groups.workspace,
        label: t('cmd.mark_all_read'),
        description: t('cmd.mark_all_read_desc'),
        keywords: ['clear alerts', 'mark read'],
        icon: CheckCheck,
        action: () => markAllRead(),
      },
      {
        id: 'workspace:terminal',
        group: groups.workspace,
        label: 'Open terminal drawer',
        description: 'Run server commands from anywhere in the dashboard.',
        keywords: ['terminal', 'shell', 'command', 'linux', 'ccna'],
        icon: TerminalSquare,
        action: () => openTerminal(),
      },
      {
        id: 'workspace:shortcuts',
        group: groups.workspace,
        label: t('cmd.show_shortcuts'),
        description: t('cmd.shortcuts_desc'),
        keywords: ['help', 'keyboard', 'shortcuts'],
        icon: Command,
        action: () => openShortcuts(),
      },
      {
        id: 'appearance:day',
        group: groups.appearance,
        label: t('cmd.switch_day'),
        description: t('cmd.day_desc'),
        keywords: ['theme', 'day', 'light', 'presentation'],
        icon: SunMedium,
        badge: theme === 'day' ? t('cmd.badge_active') : undefined,
        action: () => setTheme('day'),
      },
      {
        id: 'appearance:night',
        group: groups.appearance,
        label: t('cmd.switch_night'),
        description: t('cmd.night_desc'),
        keywords: ['theme', 'night', 'dark', 'operations'],
        icon: MoonStar,
        badge: theme === 'night' ? t('cmd.badge_active') : undefined,
        action: () => setTheme('night'),
      },
      {
        id: 'appearance:lang-en',
        group: groups.appearance,
        label: t('cmd.switch_english'),
        description: t('cmd.english_desc'),
        keywords: ['language', 'english', 'en', 'ltr', 'لغة', 'انجليزي', 'إنجليزي'],
        icon: Languages,
        badge: locale === 'en' ? t('cmd.badge_active') : undefined,
        action: () => setLocale('en'),
      },
      {
        id: 'appearance:lang-ar',
        group: groups.appearance,
        label: t('cmd.switch_arabic'),
        description: t('cmd.arabic_desc'),
        keywords: ['language', 'arabic', 'ar', 'rtl', 'عربي', 'العربية', 'لغة'],
        icon: Languages,
        badge: locale === 'ar' ? t('cmd.badge_active') : undefined,
        action: () => setLocale('ar'),
      },
      {
        id: 'appearance:layout',
        group: groups.appearance,
        label: t('cmd.use_layout', { layout: nextLayoutLabel }),
        description: nextLayoutDescription,
        keywords: ['layout', 'density', 'workspace'],
        icon: LayoutGrid,
        action: () => setLayoutMode(nextLayoutMode),
      },
      {
        id: 'session:logout',
        group: groups.session,
        label: t('cmd.sign_out'),
        description: t('cmd.sign_out_desc'),
        keywords: ['logout', 'sign out', 'session'],
        icon: LogOut,
        action: async () => {
          await logout();
          navigate('/login', { replace: true });
        },
      },
    ];
  }, [
    data?.insights.focus.note,
    data?.insights.focus.resource,
    focusMeta.icon,
    focusMeta.labelKey,
    focusRoute,
    layoutMode,
    logout,
    locale,
    markAllRead,
    navigate,
    openTerminal,
    openShortcuts,
    setLayoutMode,
    setLocale,
    setPanelOpen,
    setTheme,
    theme,
    t,
    unreadCount,
  ]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter((command) =>
      [command.group, command.label, command.description, ...command.keywords]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [commands, deferredQuery]);

  useEffect(() => {
    if (!commandPaletteOpen) {
      return;
    }

    setQuery('');
    setSelectedIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery]);

  useEffect(() => {
    if (!commandPaletteOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (filteredCommands.length ? (current + 1) % filteredCommands.length : 0));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => (filteredCommands.length ? (current - 1 + filteredCommands.length) % filteredCommands.length : 0));
      }

      if (event.key === 'Enter') {
        const command = filteredCommands[selectedIndex];
        if (!command) {
          return;
        }

        event.preventDefault();
        void executeCommand(command);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [commandPaletteOpen, filteredCommands, selectedIndex]);

  async function executeCommand(command: CommandItem) {
    closeCommandPalette();
    await command.action();
  }

  if (!commandPaletteOpen) {
    return null;
  }

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-md sm:px-6">
      <div className="absolute inset-0" onClick={closeCommandPalette} />

      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-panel/92 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-muted))]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('cmd.placeholder')}
              className="h-8 flex-1 bg-transparent text-sm text-[rgb(var(--color-text-primary))] outline-none placeholder:text-[rgb(var(--color-text-muted))]"
            />
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))] sm:flex">
              <Command className="h-3.5 w-3.5" />
              {t('topbar.ctrl_k')}
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3 sm:px-4">
          {filteredCommands.length ? (
            [t('cmd.group.navigate'), t('cmd.group.workspace'), t('cmd.group.appearance'), t('cmd.group.session')].map((group) => {
              const groupCommands = filteredCommands.filter((command) => command.group === group);

              if (!groupCommands.length) {
                return null;
              }

              return (
                <div key={group} className="mb-4">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[rgb(var(--color-text-muted))]">{group}</p>
                  <div className="space-y-1">
                    {groupCommands.map((command) => {
                      runningIndex += 1;
                      const currentIndex = runningIndex;
                      const Icon = command.icon;
                      const selected = currentIndex === selectedIndex;

                      return (
                        <button
                          key={command.id}
                          type="button"
                          onMouseEnter={() => {
                            setSelectedIndex(currentIndex);
                            void prefetchRoute(command.id.startsWith('navigate:') ? command.id.replace('navigate:', '') : '');
                          }}
                          onClick={() => void executeCommand(command)}
                          className={cn(
                            'flex w-full items-center gap-4 rounded-[24px] border px-4 py-3 text-start transition',
                            selected
                              ? 'border-brand/30 bg-brand/10'
                              : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]',
                          )}
                        >
                          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', selected ? 'border-brand/20 bg-brand/10 text-brand' : 'border-white/8 bg-white/[0.04] text-[rgb(var(--color-text-secondary))]')}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <p className="truncate font-semibold text-[rgb(var(--color-text-primary))]">{command.label}</p>
                              {command.badge ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--color-text-muted))]">
                                  {command.badge}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-sm text-[rgb(var(--color-text-secondary))]">{command.description}</p>
                          </div>
                          <Waves className={cn('h-4 w-4 transition', selected ? 'text-brand' : 'text-transparent')} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 text-center">
              <Search className="h-6 w-6 text-[rgb(var(--color-text-muted))]" />
              <p className="mt-4 text-base font-semibold text-[rgb(var(--color-text-primary))]">{t('cmd.no_matches_title')}</p>
              <p className="mt-2 max-w-md text-sm text-[rgb(var(--color-text-secondary))]">
                {t('cmd.no_matches_desc')}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-4 text-xs text-[rgb(var(--color-text-secondary))] sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="glass-chip">{t('cmd.hint_enter')}</span>
            <span className="glass-chip">{t('cmd.hint_arrows')}</span>
            <span className="glass-chip">{t('cmd.hint_esc')}</span>
            <span className="glass-chip">{t('cmd.hint_shortcuts')}</span>
          </div>
          <div className="text-[rgb(var(--color-text-muted))]">
            {data?.network.hostname ?? 'Host pending'} {data?.network.localIp ? `- ${data.network.localIp}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

