import { useQuery } from '@tanstack/react-query';
import { BellRing, Copy, Keyboard, Languages, LayoutGrid, Palette, Waves } from 'lucide-react';

import { ErrorState } from '@/components/state/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { defaultMetricsIntervalMs } from '@/lib/env';
import { copyToClipboard, formatTimestamp } from '@/lib/utils';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useI18n } from '@/providers/I18nProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { getScreenStatus } from '@/services/screen';
import { fetchNetwork } from '@/services/system';

export function SettingsPage() {
  const { user, sessionMeta } = useAuth();
  const theme = useTheme();
  const notifications = useNotifications();
  const i18n = useI18n();
  const { openCommandPalette, openShortcuts } = useWorkspace();
  const { data: liveMetrics } = useLiveMetrics();
  const { pushToast } = useToast();
  const networkQuery = useQuery({ queryKey: ['network-settings'], queryFn: fetchNetwork });
  const screenQuery = useQuery({ queryKey: ['screen-status-settings'], queryFn: getScreenStatus });

  const summary = [
    `User: ${user?.username ?? 'unknown'}`,
    `Theme: ${theme.theme}`,
    `Layout: ${theme.layoutMode}`,
    `Motion: ${theme.motionPreference}`,
    `Host: ${networkQuery.data?.hostname ?? liveMetrics?.network.hostname ?? 'loading'}`,
    `IP: ${networkQuery.data?.localIp ?? liveMetrics?.network.localIp ?? 'loading'}`,
    `Unread: ${notifications.unreadCount}`,
    `Relay: ${screenQuery.data?.metadata.providerName ?? 'loading'}`,
    `Fallback: ${defaultMetricsIntervalMs} ms`,
  ].join('\n');

  async function copySummary() {
    try {
      await copyToClipboard(summary);
      pushToast({ title: 'Copied', description: 'Summary copied', variant: 'success' });
    } catch (error) {
      pushToast({
        title: 'Failed',
        description: error instanceof Error ? error.message : 'Copy failed',
        variant: 'danger',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]">Operations Settings</p>
            <h1 className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))] sm:text-3xl">Node Policy and UX</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={openCommandPalette}>
              <Keyboard className="h-4 w-4" />
              Cmd
            </Button>
            <Button variant="secondary" size="sm" onClick={copySummary}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="premium-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand" />
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Theme</p>
              </div>
              <div className="grid gap-2">
                <Button variant={theme.theme === 'day' ? 'primary' : 'secondary'} onClick={() => theme.setTheme('day')}>Day</Button>
                <Button variant={theme.theme === 'night' ? 'primary' : 'secondary'} onClick={() => theme.setTheme('night')}>Night</Button>
              </div>
            </div>

            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-info" />
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Layout</p>
              </div>
              <div className="grid gap-2">
                <Button variant={theme.layoutMode === 'desktop' ? 'primary' : 'secondary'} onClick={() => theme.setLayoutMode('desktop')}>Desktop</Button>
                <Button variant={theme.layoutMode === 'adaptive' ? 'primary' : 'secondary'} onClick={() => theme.setLayoutMode('adaptive')}>Adaptive</Button>
              </div>
            </div>

            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Waves className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Motion</p>
              </div>
              <div className="grid gap-2">
                <Button variant={theme.motionPreference === 'full' ? 'primary' : 'secondary'} onClick={() => theme.setMotionPreference('full')}>Full</Button>
                <Button variant={theme.motionPreference === 'reduced' ? 'primary' : 'secondary'} onClick={() => theme.setMotionPreference('reduced')}>Reduced</Button>
              </div>
            </div>

            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-success" />
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Language</p>
              </div>
              <div className="grid gap-2">
                <Button variant={i18n.locale === 'en' ? 'primary' : 'secondary'} onClick={() => i18n.setLocale('en')}>{i18n.t('locale.english')}</Button>
                <Button variant={i18n.locale === 'ar' ? 'primary' : 'secondary'} onClick={() => i18n.setLocale('ar')}>{i18n.t('locale.arabic')}</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Node Status</h3>
            <Badge variant="neutral">{notifications.unreadCount} unread</Badge>
          </div>

          <div className="space-y-3 text-sm text-[rgb(var(--color-text-secondary))]">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>User</span>
              <span className="font-semibold text-[rgb(var(--color-text-primary))]">{user?.username ?? 'Unknown'}</span>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>Role</span>
              <span className="font-semibold text-[rgb(var(--color-text-primary))]">{user?.role ?? 'Unknown'}</span>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>Linux Host</span>
              <span className="font-semibold text-[rgb(var(--color-text-primary))]">{networkQuery.data?.hostname ?? liveMetrics?.network.hostname ?? 'Loading'}</span>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>Remote Relay</span>
              <span className="font-semibold text-[rgb(var(--color-text-primary))]">{screenQuery.data?.metadata.providerName ?? 'Loading'}</span>
            </div>
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>Created</span>
              <span className="font-semibold text-[rgb(var(--color-text-primary))]">{sessionMeta ? formatTimestamp(sessionMeta.createdAt) : 'Unavailable'}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={openShortcuts}>
              <Keyboard className="h-4 w-4" />
              Shortcuts
            </Button>
            <Button variant="secondary" onClick={notifications.markAllRead}>
              <BellRing className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {(networkQuery.isError || screenQuery.isError) ? (
            <div className="mt-4">
              <ErrorState title="Partial data" message={(networkQuery.error as Error | undefined)?.message ?? (screenQuery.error as Error | undefined)?.message ?? 'Error'} />
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
