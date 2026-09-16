import {
  Activity,
  Cpu,
  FolderTree,
  HardDrive,
  LayoutDashboard,
  MonitorPlay,
  Box,
  Radio,
  Sparkles,
  Settings,
  TerminalSquare,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

import type { TranslationKey } from '@/lib/i18n';

export type NavigationItem = {
  to: string;
  labelKey: TranslationKey;
  shortLabelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: LucideIcon;
};

export const navigation: NavigationItem[] = [
  {
    to: '/',
    labelKey: 'nav.overview.label',
    shortLabelKey: 'nav.overview.short',
    descriptionKey: 'nav.overview.desc',
    icon: LayoutDashboard,
  },
  {
    to: '/cpu',
    labelKey: 'nav.cpu.label',
    shortLabelKey: 'nav.cpu.short',
    descriptionKey: 'nav.cpu.desc',
    icon: Cpu,
  },
  {
    to: '/ram',
    labelKey: 'nav.ram.label',
    shortLabelKey: 'nav.ram.short',
    descriptionKey: 'nav.ram.desc',
    icon: Activity,
  },
  {
    to: '/storage',
    labelKey: 'nav.storage.label',
    shortLabelKey: 'nav.storage.short',
    descriptionKey: 'nav.storage.desc',
    icon: HardDrive,
  },
  {
    to: '/network',
    labelKey: 'nav.network.label',
    shortLabelKey: 'nav.network.short',
    descriptionKey: 'nav.network.desc',
    icon: Waypoints,
  },
  {
    to: '/files',
    labelKey: 'nav.files.label',
    shortLabelKey: 'nav.files.short',
    descriptionKey: 'nav.files.desc',
    icon: FolderTree,
  },
  {
    to: '/media',
    labelKey: 'nav.media.label',
    shortLabelKey: 'nav.media.short',
    descriptionKey: 'nav.media.desc',
    icon: Radio,
  },
  {
    to: '/screen',
    labelKey: 'nav.screen.label',
    shortLabelKey: 'nav.screen.short',
    descriptionKey: 'nav.screen.desc',
    icon: MonitorPlay,
  },
  {
    to: '/terminal',
    labelKey: 'nav.terminal.label',
    shortLabelKey: 'nav.terminal.short',
    descriptionKey: 'nav.terminal.desc',
    icon: TerminalSquare,
  },
  {
    to: '/containers',
    labelKey: 'nav.containers.label' as TranslationKey,
    shortLabelKey: 'nav.containers.short' as TranslationKey,
    descriptionKey: 'nav.containers.desc' as TranslationKey,
    icon: Box,
  },
  {
    to: '/homelab',
    labelKey: 'Homelab Intelligence' as TranslationKey,
    shortLabelKey: 'Homelab' as TranslationKey,
    descriptionKey: 'Maturity scoring, service strategy, and roadmap for serious home servers.' as TranslationKey,
    icon: Sparkles,
  },
  {
    to: '/settings',
    labelKey: 'nav.settings.label',
    shortLabelKey: 'nav.settings.short',
    descriptionKey: 'nav.settings.desc',
    icon: Settings,
  },
];

const fallbackRoute = navigation[0];

export function getRouteMeta(pathname: string): NavigationItem {
  if (pathname === '/') {
    return fallbackRoute;
  }

  return navigation.find((item) => item.to !== '/' && pathname.startsWith(item.to)) ?? fallbackRoute;
}
