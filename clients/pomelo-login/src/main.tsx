import React, { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PomeloLoginApolloProvider, createPomeloLoginApolloClient } from './services/graphql/apollo';
import { I18nProvider, useI18n } from './services/i18n/i18n';
import {
  buildCanonicalPath,
  getCurrentFullPath,
  normalizeLegacyEntry,
  toSearch,
  LOGIN_ROUTE,
} from './services/navigation/routes';
import { applyStoredThemePreference, getResolvedThemeMode } from './services/theme/theme';
import './styles/global.less';

applyStoredThemePreference();
normalizeLegacyEntry();

function readRootToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveAntdThemeTokens() {
  return {
    colorPrimary: readRootToken('--theme-primary'),
    colorSuccess: readRootToken('--color-success'),
    colorWarning: readRootToken('--color-warning'),
    colorError: readRootToken('--color-error'),
    colorInfo: readRootToken('--color-info'),
    colorBgBase: readRootToken('--body-background'),
    colorBgContainer: readRootToken('--component-background'),
    colorBgElevated: readRootToken('--component-background'),
    colorBgLayout: readRootToken('--body-background'),
    colorBorder: readRootToken('--border-color-base'),
    colorBorderSecondary: readRootToken('--component-background-soft'),
    colorText: readRootToken('--text-primary'),
    colorTextHeading: readRootToken('--text-primary'),
    colorTextSecondary: readRootToken('--text-secondary'),
    colorTextDisabled: readRootToken('--text-disabled'),
    colorTextLightSolid: readRootToken('--text-inverse'),
  };
}

function useResolvedThemeMode() {
  const [themeMode, setThemeMode] = useState(() => getResolvedThemeMode());

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncThemeMode = () => setThemeMode(getResolvedThemeMode());
    const observer = new MutationObserver(syncThemeMode);

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    media.addEventListener('change', syncThemeMode);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', syncThemeMode);
    };
  }, []);

  return themeMode;
}

function redirectToLogin() {
  const currentPath = getCurrentFullPath();
  const target = buildCanonicalPath(LOGIN_ROUTE);
  const search = currentPath.startsWith(target) ? '' : toSearch({ returnUrl: currentPath });
  window.location.replace(`${target}${search}`);
}

function Root() {
  const { antdLocale } = useI18n();
  const themeMode = useResolvedThemeMode();
  const isDark = themeMode === 'dark';
  const client = useMemo(() => createPomeloLoginApolloClient(redirectToLogin), []);
  const theme = useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        borderRadius: 6,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        ...resolveAntdThemeTokens(),
      },
    }),
    [isDark],
  );

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      <AntdApp>
        <PomeloLoginApolloProvider client={client}>
          <App />
        </PomeloLoginApolloProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <Root />
    </I18nProvider>
  </React.StrictMode>,
);
