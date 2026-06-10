import React, { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { InitializeApolloProvider, createInitializeApolloClient } from './services/graphql/apollo';
import { I18nProvider, useI18n } from './services/i18n/i18n';
import { getResolvedThemeMode, observeResolvedThemeMode } from './services/theme/theme';
import './styles/global.less';

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

function Root() {
  const [themeMode, setThemeMode] = useState(() => getResolvedThemeMode());
  const { antdLocale } = useI18n();
  const client = useMemo(() => createInitializeApolloClient(), []);

  useEffect(() => observeResolvedThemeMode(setThemeMode), []);

  const theme = useMemo(
    () => ({
      algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        borderRadius: 18,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        ...resolveAntdThemeTokens(),
      },
      components: {
        Button: {
          controlHeightLG: 46,
          fontWeight: 700,
          defaultShadow: 'none',
          primaryShadow: `0 18px 36px ${readRootToken('--theme-primary-shadow')}`,
        },
        Input: {
          controlHeightLG: 46,
        },
        Select: {
          controlHeightLG: 46,
        },
      },
    }),
    [themeMode],
  );

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      <AntdApp>
        <InitializeApolloProvider client={client}>
          <App />
        </InitializeApolloProvider>
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
