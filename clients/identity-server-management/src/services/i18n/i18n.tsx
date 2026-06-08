import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type { PropsWithChildren } from 'react';

export type AppLocale = 'zh-CN' | 'en-US';

const LOCALE_STORAGE_KEY = 'pomelo.identity.management.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

const resources: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    'app.identity': 'Identity',
    'app.management': '管理后台',
    'app.console': 'Identity Server 控制台',
    'app.logout': '退出',

    'language.switchToEnglish': '切换到英文',
    'language.switchToChinese': '切换到中文',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': '当前跟随系统，切换到暗色主题',
    'theme.darkToLight': '当前暗色主题，切换到亮色主题',
    'theme.lightToSystem': '当前亮色主题，切换到跟随系统',

    'nav.clients': '客户端',
    'nav.apiResources': 'API 资源',
    'nav.identityResources': '身份资源',

    'login.brand': 'Pomelo Identity',
    'login.title': '身份管理',
    'login.username': '账号',
    'login.password': '密码',
    'login.usernamePlaceholder': '请输入账号',
    'login.passwordPlaceholder': '请输入密码',
    'login.submit': '登录',
    'login.error': '登录失败，请检查账号或密码',

    'resource.loading': '加载中',
    'resource.count': '{count} 项',
    'resource.search': '搜索',
    'resource.refresh': '刷新',
    'resource.create': '创建',
    'resource.add': '新增',
    'resource.detail': '详情',
    'resource.update': '更新',
    'resource.noOwner': '请选择关联资源',
    'resource.operationFailed': '操作失败',

    'table.actions': '操作',
    'table.select': '选择',
    'table.delete': '删除',

    'page.clients': '客户端',
    'page.apiResources': 'API 资源',
    'page.identityResources': '身份资源',

    'panel.claims': '声明',
    'panel.corsOrigins': 'CORS 源',
    'panel.grantTypes': '授权类型',
    'panel.scopes': '作用域',
    'panel.redirectUris': '重定向 URI',
    'panel.postLogoutRedirectUris': '登出后重定向 URI',
    'panel.secrets': '密钥',
    'panel.properties': '属性',
    'panel.scopeClaims': 'Scope Claims',
    'panel.apiScopeClaims': 'API Scope Claims',

    'fields.id': 'ID',
    'fields.name': '名称',
    'fields.displayName': '显示名称',
    'fields.description': '描述',
    'fields.enabled': '启用',
    'fields.type': '类型',
    'fields.value': '值',
    'fields.key': '键',
    'fields.origin': '源',
    'fields.scope': '作用域',
    'fields.grantType': '授权类型',
    'fields.redirectUri': '重定向 URI',
    'fields.postLogoutRedirectUri': '登出后重定向 URI',
    'fields.expiresAt': '过期时间',
    'fields.clientId': '客户端 ID',
    'fields.clientName': '客户端名称',
    'fields.applicationType': '应用类型',
    'fields.clientUri': '客户端 URI',

    'placeholder.apiScopeId': 'API Scope ID',
  },
  'en-US': {
    'app.identity': 'Identity',
    'app.management': 'Management',
    'app.console': 'Identity Server Console',
    'app.logout': 'Logout',

    'language.switchToEnglish': 'Switch to English',
    'language.switchToChinese': 'Switch to Chinese',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': 'Using system theme, switch to dark theme',
    'theme.darkToLight': 'Using dark theme, switch to light theme',
    'theme.lightToSystem': 'Using light theme, switch to system theme',

    'nav.clients': 'Clients',
    'nav.apiResources': 'API Resources',
    'nav.identityResources': 'Identity Resources',

    'login.brand': 'Pomelo Identity',
    'login.title': 'Identity Management',
    'login.username': 'Account',
    'login.password': 'Password',
    'login.usernamePlaceholder': 'Enter account',
    'login.passwordPlaceholder': 'Enter password',
    'login.submit': 'Login',
    'login.error': 'Login failed. Check your account or password.',

    'resource.loading': 'Loading',
    'resource.count': '{count} items',
    'resource.search': 'Search',
    'resource.refresh': 'Refresh',
    'resource.create': 'Create',
    'resource.add': 'Add',
    'resource.detail': 'Details',
    'resource.update': 'Update',
    'resource.noOwner': 'Select a related resource',
    'resource.operationFailed': 'Operation failed',

    'table.actions': 'Actions',
    'table.select': 'Select',
    'table.delete': 'Delete',

    'page.clients': 'Clients',
    'page.apiResources': 'API Resources',
    'page.identityResources': 'Identity Resources',

    'panel.claims': 'Claims',
    'panel.corsOrigins': 'CORS Origins',
    'panel.grantTypes': 'Grant Types',
    'panel.scopes': 'Scopes',
    'panel.redirectUris': 'Redirect URIs',
    'panel.postLogoutRedirectUris': 'Post Logout Redirect URIs',
    'panel.secrets': 'Secrets',
    'panel.properties': 'Properties',
    'panel.scopeClaims': 'Scope Claims',
    'panel.apiScopeClaims': 'API Scope Claims',

    'fields.id': 'ID',
    'fields.name': 'Name',
    'fields.displayName': 'Display Name',
    'fields.description': 'Description',
    'fields.enabled': 'Enabled',
    'fields.type': 'Type',
    'fields.value': 'Value',
    'fields.key': 'Key',
    'fields.origin': 'Origin',
    'fields.scope': 'Scope',
    'fields.grantType': 'Grant Type',
    'fields.redirectUri': 'Redirect URI',
    'fields.postLogoutRedirectUri': 'Post Logout Redirect URI',
    'fields.expiresAt': 'Expires At',
    'fields.clientId': 'Client ID',
    'fields.clientName': 'Client Name',
    'fields.applicationType': 'Application Type',
    'fields.clientUri': 'Client URI',

    'placeholder.apiScopeId': 'API Scope ID',
  },
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
