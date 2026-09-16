import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { fetchActivity } from '@/services/system';
import type { ActivityItem } from '@/types/api';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useToast } from '@/providers/ToastProvider';

type NotificationsContextValue = {
  items: ActivityItem[];
  unreadCount: number;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function uniqueItems(items: ActivityItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const { data } = useLiveMetrics();
  const { pushToast } = useToast();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const initializedRef = useRef(false);
  const lastTopIdRef = useRef<string | null>(null);

  const activityQuery = useQuery({
    queryKey: ['system-activity'],
    queryFn: () => fetchActivity(20),
    enabled: Boolean(token),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!token) {
      setItems([]);
      setUnreadIds([]);
      setPanelOpen(false);
      initializedRef.current = false;
      lastTopIdRef.current = null;
      return;
    }

    const sourceItems = uniqueItems(data?.overview.recentActivity?.length ? data.overview.recentActivity : activityQuery.data ?? []);
    if (!sourceItems.length) {
      return;
    }

    setItems(sourceItems);

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastTopIdRef.current = sourceItems[0]?.id ?? null;
      return;
    }

    const previousTopId = lastTopIdRef.current;
    const previousIndex = previousTopId ? sourceItems.findIndex((item) => item.id === previousTopId) : -1;
    const nextItems = previousIndex === -1 ? sourceItems.slice(0, 3) : sourceItems.slice(0, previousIndex);

    if (nextItems.length) {
      setUnreadIds((current) => uniqueItems([...nextItems, ...sourceItems.filter((item) => current.includes(item.id))]).map((item) => item.id));

      nextItems.slice(0, 2).forEach((item) => {
        pushToast({
          title: item.source === 'system'
            ? 'System event'
            : item.source === 'auth'
              ? 'Access event'
              : item.source === 'screen'
                ? 'Screen relay event'
                : item.source === 'media'
                  ? 'Media broadcast event'
                  : 'File event',
          description: item.message,
          variant: item.level === 'info' ? 'info' : item.level === 'warning' ? 'warning' : 'danger',
        });
      });
    }

    lastTopIdRef.current = sourceItems[0]?.id ?? null;
  }, [activityQuery.data, data, pushToast, token]);

  const value = useMemo(
    () => ({
      items,
      unreadCount: unreadIds.length,
      panelOpen,
      setPanelOpen,
      markAllRead: () => setUnreadIds([]),
    }),
    [items, panelOpen, unreadIds.length],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
}