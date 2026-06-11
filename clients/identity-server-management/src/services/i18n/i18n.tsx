import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import enUSMessages from './locales/en-US.json';
import zhCNMessages from './locales/zh-CN.json';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type { PropsWithChildren } from 'react';

export type AppLocale = 'zh-CN' | 'en-US';

const LOCALE_STORAGE_KEY = 'pomelo.identity.management.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

const resources: Record<AppLocale, Record<string, string>> = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
};

type I18nContextValue = {
  locale: AppLocale;
  antdLocale: AntdLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  t: (key: string, values?: Record<string, string | number>, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'zh-CN' || value === 'en-US';
}

export function getStoredLocale(): AppLocale {
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getNextLocale(locale: AppLocale): AppLocale {
  return locale === 'zh-CN' ? 'en-US' : 'zh-CN';
}

export function getAntdLocale(locale: AppLocale): AntdLocale {
  return locale === 'zh-CN' ? zhCN : enUS;
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;

  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getStoredLocale());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((currentLocale) => {
      const nextLocale = getNextLocale(currentLocale);
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      return nextLocale;
    });
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>, fallback?: string) =>
      interpolate(resources[locale][key] ?? fallback ?? key, values),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const syncStoredLocale = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY && isAppLocale(event.newValue)) {
        setLocaleState(event.newValue);
      }
    };

    window.addEventListener('storage', syncStoredLocale);
    return () => window.removeEventListener('storage', syncStoredLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      antdLocale: getAntdLocale(locale),
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, t, toggleLocale],
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
