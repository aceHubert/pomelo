import React from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
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
import 'antd/dist/reset.css';
import './styles/global.less';

applyStoredThemePreference();
normalizeLegacyEntry();

const lightThemeTokens = {
  colorPrimary: '#408a71',
  colorSuccess: '#1abd80',
  colorWarning: '#fda900',
  colorError: '#f82024',
  colorInfo: '#0477f7',
  colorBgBase: '#f7f7f2',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#f7f7f2',
  colorBorder: '#d8d8d0',
  colorBorderSecondary: '#efefea',
  colorText: '#212121',
  colorTextHeading: '#212121',
  colorTextSecondary: '#616161',
  colorTextDisabled: '#bdbdbd',
  colorTextLightSolid: '#fafafa',
};

const darkThemeTokens = {
  colorPrimary: '#408a71',
  colorSuccess: '#1abd80',
  colorWarning: '#fda900',
  colorError: '#f82024',
  colorInfo: '#0477f7',
  colorBgBase: '#0d0d0d',
  colorBgContainer: '#171717',
  colorBgElevated: '#171717',
  colorBgLayout: '#0d0d0d',
  colorBorder: '#32322f',
  colorBorderSecondary: '#222220',
  colorText: '#fafafa',
  colorTextHeading: '#fafafa',
  colorTextSecondary: '#eeeeee',
  colorTextDisabled: '#bdbdbd',
  colorTextLightSolid: '#fafafa',
};

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
        ...(isDark ? darkThemeTokens : lightThemeTokens),
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
