import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';
import { CommandPalette } from './CommandPalette';
import { GlobalTerminalDrawer } from './GlobalTerminalDrawer';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { MobileDock } from './mobile-dock';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell() {
  const { layoutMode, resolvedTheme } = useTheme();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className={`desktop-frame relative flex min-h-screen bg-canvas ${resolvedTheme === 'day' ? 'text-slate-900' : 'text-slate-100'}`}>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col pb-3 pr-3">
        <Topbar onToggleNavigation={() => setMobileNavOpen((current) => !current)} />
        <main className={`relative flex-1 overflow-y-auto ${layoutMode === 'desktop' ? 'px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-5 xl:px-8 xl:pt-6' : 'px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-5'}`}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="absolute left-[-12rem] top-[-10rem] h-80 w-80 rounded-full bg-brand/12 blur-3xl" />
            <div className="absolute right-[-10rem] top-20 h-72 w-72 rounded-full bg-info/12 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-warning/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_25%)]" />
          </div>
          <div key={location.pathname} className="motion-route-stage relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileDock />
      <GlobalTerminalDrawer />
      <CommandPalette />
      <KeyboardShortcutsDialog />
    </div>
  );
}
