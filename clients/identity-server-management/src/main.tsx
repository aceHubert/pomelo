import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import { App } from './App';
import { createManagementApolloClient, ManagementApolloProvider } from './services/graphql/apollo';
import { getManagementToken } from './services/auth/token';
import { applyStoredThemePreference, getResolvedThemeMode } from './services/theme/theme';
import { I18nProvider, useI18n } from './services/i18n/i18n';
import 'antd/dist/reset.css';
import './styles/global.less';

applyStoredThemePreference();

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

function Root() {
  const [token, setToken] = useState(getManagementToken());
  const themeMode = useResolvedThemeMode();
  const { antdLocale } = useI18n();
  const isDark = themeMode === 'dark';
  const client = useMemo(
    () =>
      createManagementApolloClient(() => {
        setToken(null);
        window.location.hash = '#/login';
      }),
    [],
  );
  const theme = useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        borderRadius: 6,
        ...(isDark ? darkThemeTokens : lightThemeTokens),
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    }),
    [isDark],
  );

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      <ManagementApolloProvider client={client}>
        <App token={token} onLogin={setToken} onLogout={() => setToken(null)} />
      </ManagementApolloProvider>
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
