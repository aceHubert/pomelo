import React from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import { App } from './App';
import { InitializeApolloProvider, createInitializeApolloClient } from './services/graphql/apollo';
import { I18nProvider, useI18n } from './services/i18n/i18n';
import { getResolvedThemeMode, observeResolvedThemeMode } from './services/theme/theme';
import 'antd/dist/reset.css';
import './styles/global.less';

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
        ...(themeMode === 'dark' ? darkThemeTokens : lightThemeTokens),
      },
      components: {
        Button: {
          controlHeightLG: 46,
          fontWeight: 700,
          defaultShadow: 'none',
          primaryShadow: '0 18px 36px rgba(64, 138, 113, 0.24)',
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
