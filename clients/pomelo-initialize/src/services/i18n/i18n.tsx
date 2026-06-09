import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type { PropsWithChildren } from 'react';

export type AppLocale = 'zh-CN' | 'en-US';

const LOCALE_STORAGE_KEY = 'pomelo.initialize.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

const resources: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    'site.title': '站点初始化',

    'common.loading': '加载中...',
    'common.refresh': '刷新',

    'language.switchToEnglish': '切换到英文',
    'language.switchToChinese': '切换到中文',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'initialize.brand': 'Pomelo Initialize',
    'initialize.title': '站点初始化',
    'initialize.description': '首次启动前，请完成站点基础信息与管理员账号配置。',
    'initialize.checkError': '初始化检查失败，请联系管理员。',
    'initialize.startError': '初始化失败，请稍后重试。',
    'initialize.success': '初始化成功，正在跳转...',
    'initialize.submit': '提交',
    'initialize.result.successTitle': '初始化成功',
    'initialize.result.initializedTitle': '站点已初始化',
    'initialize.result.successSubtitle': '当前入口未携带 returnUrl，系统不会自动跳转，请按以下说明继续使用。',
    'initialize.result.initializedSubtitle': '当前入口未携带 returnUrl，系统无法自动回跳，请按以下说明继续使用。',
    'initialize.result.guideTitle': '使用说明',
    'initialize.result.guideDescription': '请优先进入管理后台完成后续配置。站点主页入口固定使用当前站点的 / 。',
    'initialize.result.adminUrl': '管理后台入口',
    'initialize.result.homeUrl': '站点主页入口',
    'initialize.result.email': '管理员邮箱',
    'initialize.result.locale': '默认语言',
    'initialize.result.goAdmin': '进入管理后台',
    'initialize.result.goHome': '打开站点主页',
    'initialize.result.successStep1': '使用刚刚配置的管理员邮箱和密码登录后台。',
    'initialize.result.successStep2': '登录后继续完善站点设置、权限和内容配置。',
    'initialize.result.successStep3': '确认当前站点的 / 可访问后，再将用户流量切换到正式入口。',
    'initialize.result.initializedStep1': '请使用已有管理员账号登录后台继续处理。',
    'initialize.result.initializedStep2': '如果需要重新初始化，请先联系管理员确认当前数据状态。',
    'initialize.result.initializedStep3': '若只是查看前台效果，可直接打开当前站点的 / 。',

    'initialize.fields.title.label': '站点标题',
    'initialize.fields.title.placeholder': '请输入站点标题',
    'initialize.fields.title.required': '请输入站点标题',

    'initialize.fields.password.label': '管理员密码',
    'initialize.fields.password.placeholder': '请输入管理员密码',
    'initialize.fields.password.required': '请输入管理员密码',
    'initialize.fields.password.invalid': '请输入 6 位以上密码，并至少包含字母和数字',

    'initialize.fields.email.label': '管理员邮箱',
    'initialize.fields.email.placeholder': '请输入管理员邮箱',
    'initialize.fields.email.required': '请输入管理员邮箱',
    'initialize.fields.email.invalid': '请输入正确的邮箱地址',

    'initialize.fields.homeUrl.label': '主页地址',
    'initialize.fields.homeUrl.placeholder': '请输入主页地址',
    'initialize.fields.homeUrl.required': '请输入主页地址',
    'initialize.fields.homeUrl.invalid': '请输入正确的主页地址',

    'initialize.fields.locale.label': '默认语言',
    'initialize.fields.locale.placeholder': '请选择默认语言',
    'initialize.fields.locale.required': '请选择默认语言',
    'initialize.fields.locale.zh-CN': '简体中文',
    'initialize.fields.locale.en-US': 'English',
  },
  'en-US': {
    'site.title': 'Site Initialize',

    'common.loading': 'Loading...',
    'common.refresh': 'Refresh',

    'language.switchToEnglish': 'Switch to English',
    'language.switchToChinese': 'Switch to Chinese',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'initialize.brand': 'Pomelo Initialize',
    'initialize.title': 'Site Initialize',
    'initialize.description': 'Complete the site basics and administrator account before first launch.',
    'initialize.checkError': 'Initialization check failed. Please contact the administrator.',
    'initialize.startError': 'Initialization failed. Please try again later.',
    'initialize.success': 'Site initialization succeeded. Redirecting...',
    'initialize.submit': 'Submit',
    'initialize.result.successTitle': 'Initialization completed',
    'initialize.result.initializedTitle': 'Site already initialized',
    'initialize.result.successSubtitle':
      'This entry does not include a returnUrl, so the app will not redirect automatically. Continue with the guide below.',
    'initialize.result.initializedSubtitle':
      'This entry does not include a returnUrl, so the app cannot jump back automatically. Continue with the guide below.',
    'initialize.result.guideTitle': 'Usage guide',
    'initialize.result.guideDescription':
      'Open the management console first to finish setup. The site home entry always uses the current site root path / .',
    'initialize.result.adminUrl': 'Management console',
    'initialize.result.homeUrl': 'Site home entry',
    'initialize.result.email': 'Administrator email',
    'initialize.result.locale': 'Default language',
    'initialize.result.goAdmin': 'Open management',
    'initialize.result.goHome': 'Open home page',
    'initialize.result.successStep1': 'Sign in with the administrator email and password you just configured.',
    'initialize.result.successStep2':
      'Finish the remaining site settings, permissions, and content configuration in the console.',
    'initialize.result.successStep3': 'Verify that the current site root path / is reachable before switching traffic.',
    'initialize.result.initializedStep1': 'Sign in with an existing administrator account to continue.',
    'initialize.result.initializedStep2':
      'If you really need to re-initialize, confirm the current data status with an administrator first.',
    'initialize.result.initializedStep3':
      'If you only need to inspect the front site, open the current site root path / directly.',

    'initialize.fields.title.label': 'Site Title',
    'initialize.fields.title.placeholder': 'Please enter the site title',
    'initialize.fields.title.required': 'Site title is required',

    'initialize.fields.password.label': 'Admin Password',
    'initialize.fields.password.placeholder': 'Please enter the admin password',
    'initialize.fields.password.required': 'Admin password is required',
    'initialize.fields.password.invalid': 'Password must be at least 6 characters and include letters and numbers',

    'initialize.fields.email.label': 'Admin Email',
    'initialize.fields.email.placeholder': 'Please enter the admin email',
    'initialize.fields.email.required': 'Admin email is required',
    'initialize.fields.email.invalid': 'Please enter a valid email address',

    'initialize.fields.homeUrl.label': 'Home URL',
    'initialize.fields.homeUrl.placeholder': 'Please enter the home URL',
    'initialize.fields.homeUrl.required': 'Home URL is required',
    'initialize.fields.homeUrl.invalid': 'Please enter a valid URL',

    'initialize.fields.locale.label': 'Default Language',
    'initialize.fields.locale.placeholder': 'Please select the default language',
    'initialize.fields.locale.required': 'Default language is required',
    'initialize.fields.locale.zh-CN': '简体中文',
    'initialize.fields.locale.en-US': 'English',
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

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;

  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

export function getStoredLocale(): AppLocale {
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

function getAntdLocale(locale: AppLocale): AntdLocale {
  return locale === 'zh-CN' ? zhCN : enUS;
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getStoredLocale());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((currentLocale) => {
      const nextLocale = currentLocale === 'zh-CN' ? 'en-US' : 'zh-CN';
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
