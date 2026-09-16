import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { translate, type Locale, type TranslationKey } from '@/lib/i18n';

type Direction = 'ltr' | 'rtl';

type I18nContextValue = {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const storageKey = 'dash-locale';
const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }

  const language = window.navigator.language.toLowerCase();
  return language.startsWith('en') ? 'en' : 'ar';
}

function directionForLocale(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>(() => detectInitialLocale());

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = directionForLocale(locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: directionForLocale(locale),
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}

