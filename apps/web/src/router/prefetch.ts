const routePrefetchers: Record<string, () => Promise<unknown>> = {
  '/': () => Promise.all([
    import('@/pages/DashboardPage'),
    import('@/components/dashboard/DashboardChartsSection'),
  ]),
  '/cpu': () => import('@/pages/CpuPage'),
  '/ram': () => import('@/pages/RamPage'),
  '/storage': () => import('@/pages/StoragePage'),
  '/network': () => import('@/pages/NetworkPage'),
  '/files': () => Promise.all([
    import('@/pages/FileManagerPage'),
    import('@/components/file-manager/FileWorkspace'),
  ]),
  '/media': () => import('@/pages/MediaBroadcastPage'),
  '/screen': () => import('@/pages/ScreenSharePage'),
  '/terminal': () => import('@/pages/TerminalPage'),
  '/containers': () => import('@/pages/ContainersPage'),
  '/homelab': () => import('@/pages/HomelabIntelligencePage'),
  '/settings': () => import('@/pages/SettingsPage'),
  '/login': () => import('@/pages/LoginPage'),
};

const prefetchedRoutes = new Set<string>();

export function prefetchRoute(path: string) {
  const normalizedPath = path === '' ? '/' : path;
  if (prefetchedRoutes.has(normalizedPath)) {
    return Promise.resolve();
  }

  const prefetcher = routePrefetchers[normalizedPath];
  if (!prefetcher) {
    return Promise.resolve();
  }

  prefetchedRoutes.add(normalizedPath);
  return prefetcher().catch(() => {
    prefetchedRoutes.delete(normalizedPath);
  });
}
