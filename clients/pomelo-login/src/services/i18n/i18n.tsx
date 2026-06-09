import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type { PropsWithChildren } from 'react';

export type AppLocale = 'zh-CN' | 'en-US';

const LOCALE_STORAGE_KEY = 'pomelo.login.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

const resources: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    'app.title': 'Pomelo 登录',
    'app.brand': 'Pomelo Auth',
    'app.loading': '加载中...',

    'language.switchToEnglish': '切换到英文',
    'language.switchToChinese': '切换到中文',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': '当前跟随系统，切换到暗色主题',
    'theme.darkToLight': '当前暗色主题，切换到亮色主题',
    'theme.lightToSystem': '当前亮色主题，切换到跟随系统',

    'common.cancel': '取消',
    'common.submit': '提交',
    'common.next': '下一步',
    'common.backToLogin': '返回登录',
    'common.openHome': '打开首页',

    'login.title': '欢迎登录',
    'login.subtitle': '使用本地账号访问 Pomelo。',
    'login.username': '用户名',
    'login.password': '密码',
    'login.usernamePlaceholder': '请输入用户名',
    'login.passwordPlaceholder': '请输入密码',
    'login.rememberMe': '记住我',
    'login.forgotPassword': '忘记密码？',
    'login.submit': '登录',
    'login.success': '登录成功，正在跳转...',
    'login.error': '登录失败，请检查用户名或密码。',

    'modify.title': '修改密码',
    'modify.subtitle': '保持旧流程，修改成功后需要重新登录。',
    'modify.username': '用户名',
    'modify.oldPassword': '旧密码',
    'modify.newPassword': '新密码',
    'modify.usernamePlaceholder': '请输入用户名',
    'modify.oldPasswordPlaceholder': '请输入旧密码',
    'modify.newPasswordPlaceholder': '请输入新密码',
    'modify.submit': '提交',
    'modify.success': '修改成功，请重新登录。',
    'modify.newPasswordMin': '新密码至少需要 {min} 位字符',

    'forgot.title': '忘记密码',
    'forgot.subtitle': '当前页面保持旧 TODO 行为，不调用后端重置接口。',
    'forgot.username': '用户名',
    'forgot.usernamePlaceholder': '请输入用户名/邮箱/手机号',
    'forgot.submit': '下一步',
    'forgot.todo': 'TODO: 发送验证码',

    'result.title': '使用说明',
    'result.subtitle': '当前地址没有携带 returnUrl，系统无法判断应该自动返回到哪个业务页面。',
    'result.loginSuccessTitle': '登录已完成，但无法自动回跳',
    'result.loginSuccessDescription': '你是直接打开登录页，或发起登录时没有附带 returnUrl。',
    'result.modifyCancelTitle': '当前无法自动返回上一页',
    'result.modifyCancelDescription': '修改密码页面没有带 returnUrl，因此取消后无法知道应返回哪个业务页面。',
    'result.forgotCancelTitle': '当前无法自动返回上一页',
    'result.forgotCancelDescription': '忘记密码页面没有带 returnUrl，因此取消后无法知道应返回哪个业务页面。',
    'result.stepsTitle': '建议这样使用',
    'result.step1': '返回触发登录的业务系统页面。',
    'result.step2': '从业务系统重新点击登录、修改密码或忘记密码入口。',
    'result.step3': '重新进入时系统会自动带上 returnUrl，认证完成后才能正确回跳。',
    'result.step4': '如果你只是想确认登录状态，也可以回到业务系统后刷新页面。',
  },
  'en-US': {
    'app.title': 'Pomelo Login',
    'app.brand': 'Pomelo Auth',
    'app.loading': 'Loading...',

    'language.switchToEnglish': 'Switch to English',
    'language.switchToChinese': 'Switch to Chinese',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': 'Using system theme, switch to dark theme',
    'theme.darkToLight': 'Using dark theme, switch to light theme',
    'theme.lightToSystem': 'Using light theme, switch to system theme',

    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.next': 'Next',
    'common.backToLogin': 'Back to login',
    'common.openHome': 'Open home',

    'login.title': 'Sign in',
    'login.subtitle': 'Use your local account to access Pomelo.',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.usernamePlaceholder': 'Enter username',
    'login.passwordPlaceholder': 'Enter password',
    'login.rememberMe': 'Remember me',
    'login.forgotPassword': 'Forgot password?',
    'login.submit': 'Sign in',
    'login.success': 'Signed in successfully, redirecting...',
    'login.error': 'Login failed. Please check your username or password.',

    'modify.title': 'Modify password',
    'modify.subtitle': 'Keep the existing flow and sign in again after the password changes.',
    'modify.username': 'Username',
    'modify.oldPassword': 'Old password',
    'modify.newPassword': 'New password',
    'modify.usernamePlaceholder': 'Enter username',
    'modify.oldPasswordPlaceholder': 'Enter old password',
    'modify.newPasswordPlaceholder': 'Enter new password',
    'modify.submit': 'Submit',
    'modify.success': 'Password updated. Please sign in again.',
    'modify.newPasswordMin': 'New password must be at least {min} characters',

    'forgot.title': 'Forgot password',
    'forgot.subtitle': 'This page keeps the existing TODO behavior and does not call a reset API.',
    'forgot.username': 'Username',
    'forgot.usernamePlaceholder': 'Enter username / email / mobile',
    'forgot.submit': 'Next',
    'forgot.todo': 'TODO: Send verification code',

    'result.title': 'Instructions',
    'result.subtitle':
      'The current address does not include a returnUrl, so the app cannot determine where to navigate back automatically.',
    'result.loginSuccessTitle': 'Signed in, but cannot navigate back automatically',
    'result.loginSuccessDescription':
      'You opened the login page directly, or the login request was started without a returnUrl.',
    'result.modifyCancelTitle': 'Cannot return to the previous page automatically',
    'result.modifyCancelDescription':
      'The modify password page was opened without a returnUrl, so cancel cannot know which business page to return to.',
    'result.forgotCancelTitle': 'Cannot return to the previous page automatically',
    'result.forgotCancelDescription':
      'The forgot password page was opened without a returnUrl, so cancel cannot know which business page to return to.',
    'result.stepsTitle': 'Recommended usage',
    'result.step1': 'Return to the business system page that triggered the authentication flow.',
    'result.step2': 'Open the login, modify password, or forgot password entry again from that system.',
    'result.step3':
      'When re-entered from the system, the returnUrl will be attached automatically and the app can navigate back correctly.',
    'result.step4':
      'If you only want to confirm your sign-in status, go back to the business system and refresh the page.',
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
