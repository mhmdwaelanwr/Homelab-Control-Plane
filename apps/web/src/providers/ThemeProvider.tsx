import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type ThemePreference = 'night' | 'day';
type ResolvedTheme = 'night' | 'day';
type LayoutMode = 'adaptive' | 'desktop';
type MotionPreference = 'full' | 'reduced';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  layoutMode: LayoutMode;
  motionPreference: MotionPreference;
  setTheme: (theme: ThemePreference) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setMotionPreference: (mode: MotionPreference) => void;
};

const storageKey = 'dash-theme-preference';
const layoutStorageKey = 'dash-layout-mode';
const motionStorageKey = 'dash-motion-preference';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'night';
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'day' || stored === 'night') {
    return stored;
  }

  // Backward compatibility with old preferences.
  if (stored === 'graphite') {
    return 'night';
  }

  if (stored === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
  }

  return 'night';
}

function readStoredLayout(): LayoutMode {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const stored = window.localStorage.getItem(layoutStorageKey);
  return stored === 'adaptive' || stored === 'desktop' ? stored : 'desktop';
}

function readStoredMotion(): MotionPreference {
  if (typeof window === 'undefined') {
    return 'full';
  }

  const stored = window.localStorage.getItem(motionStorageKey);
  return stored === 'reduced' || stored === 'full' ? stored : 'full';
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  return theme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => readStoredLayout());
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(() => readStoredMotion());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()));

  useEffect(() => {
    const applyTheme = () => {
      const nextResolvedTheme = resolveTheme(theme);
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.dataset.theme = nextResolvedTheme;
      document.documentElement.dataset.themePreference = theme;
      document.documentElement.style.colorScheme = nextResolvedTheme === 'day' ? 'light' : 'dark';
    };

    applyTheme();
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(layoutStorageKey, layoutMode);
    document.documentElement.dataset.layout = layoutMode;
  }, [layoutMode]);

  useEffect(() => {
    window.localStorage.setItem(motionStorageKey, motionPreference);
    document.documentElement.dataset.motion = motionPreference;
  }, [motionPreference]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      layoutMode,
      motionPreference,
      setTheme,
      setLayoutMode,
      setMotionPreference,
    }),
    [layoutMode, motionPreference, resolvedTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
