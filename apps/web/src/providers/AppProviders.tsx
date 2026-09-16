import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { LiveMetricsProvider } from '@/providers/LiveMetricsProvider';
import { NotificationsProvider } from '@/providers/NotificationsProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <WorkspaceProvider>
            <AuthProvider>
              <ToastProvider>
                <LiveMetricsProvider>
                  <NotificationsProvider>{children}</NotificationsProvider>
                </LiveMetricsProvider>
              </ToastProvider>
            </AuthProvider>
          </WorkspaceProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
