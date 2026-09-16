import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { RouteFallback } from '@/components/state/RouteFallback';
import { AdminLayout } from '@/layouts/AdminLayout';

const LoginPage = lazy(async () => ({ default: (await import('@/pages/LoginPage')).LoginPage }));
const DashboardPage = lazy(async () => ({ default: (await import('@/pages/DashboardPage')).DashboardPage }));
const CpuPage = lazy(async () => ({ default: (await import('@/pages/CpuPage')).CpuPage }));
const RamPage = lazy(async () => ({ default: (await import('@/pages/RamPage')).RamPage }));
const StoragePage = lazy(async () => ({ default: (await import('@/pages/StoragePage')).StoragePage }));
const NetworkPage = lazy(async () => ({ default: (await import('@/pages/NetworkPage')).NetworkPage }));
const FileManagerPage = lazy(async () => ({ default: (await import('@/pages/FileManagerPage')).FileManagerPage }));
const MediaBroadcastPage = lazy(async () => ({ default: (await import('@/pages/MediaBroadcastPage')).MediaBroadcastPage }));
const ScreenSharePage = lazy(async () => ({ default: (await import('@/pages/ScreenSharePage')).ScreenSharePage }));
const SettingsPage = lazy(async () => ({ default: (await import('@/pages/SettingsPage')).SettingsPage }));
const TerminalPage = lazy(async () => ({ default: (await import('@/pages/TerminalPage')).TerminalPage }));
const ContainersPage = lazy(async () => ({ default: (await import('@/pages/ContainersPage')).ContainersPage }));
const HomelabIntelligencePage = lazy(
  async () => ({ default: (await import('@/pages/HomelabIntelligencePage')).HomelabIntelligencePage }),
);

function withRouteFallback(element: React.ReactNode, mode: 'auth' | 'app' = 'app') {
  return <Suspense fallback={<RouteFallback mode={mode} />}>{element}</Suspense>;
}

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: withRouteFallback(<LoginPage />, 'auth'),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: withRouteFallback(<DashboardPage />) },
          { path: '/cpu', element: withRouteFallback(<CpuPage />) },
          { path: '/ram', element: withRouteFallback(<RamPage />) },
          { path: '/storage', element: withRouteFallback(<StoragePage />) },
          { path: '/network', element: withRouteFallback(<NetworkPage />) },
          { path: '/files', element: withRouteFallback(<FileManagerPage />) },
          { path: '/media', element: withRouteFallback(<MediaBroadcastPage />) },
          { path: '/screen', element: withRouteFallback(<ScreenSharePage />) },
          { path: '/terminal', element: withRouteFallback(<TerminalPage />) },
          { path: '/containers', element: withRouteFallback(<ContainersPage />) },
          { path: '/homelab', element: withRouteFallback(<HomelabIntelligencePage />) },
          { path: '/settings', element: withRouteFallback(<SettingsPage />) },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
