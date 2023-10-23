import { ref, reactive, computed } from '@vue/composition-api';
import { Theme } from 'antdv-layout-pro/types';
import { warn } from '@ace-util/core';
import { useI18n, useEffect } from '@/hooks';
import { useAppStore } from '@/store';

// Types
import type { Locale } from 'ant-design-vue/types/locale-provider';

// Ant locales, 减少打包内容
const AntLocales: Record<string, () => Promise<Locale>> = {
  'zh-CN': () => import('ant-design-vue/lib/locale/zh_CN').then((data) => data.default || data),
  'en-US': () => import('ant-design-vue/lib/locale/en_US').then((data) => data.default || data),
};

/**
 * App 基础配置
 */
export const useAppMixin = () => {
  const i18n = useI18n();
  const appStore = useAppStore();

  // antd locale
  const antLocales = ref<Locale>({ locale: i18n.locale });

  /**
   * Admin logo
   */
  const siteLogo = computed(() => appStore.siteLogo);

  /**
   * Admin site title
   */
  const siteTitle = computed(() =>
    typeof appStore.siteTitle === 'function'
      ? appStore.siteTitle((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string)
      : appStore.siteTitle,
  );

  const layout = computed(() => appStore.layout);
  const supportLanguages = computed(() => appStore.supportLanguages);

  const primaryColor = computed(() => appStore.primaryColor);
  const theme = computed(() => appStore.theme);
  const isDark = computed(() => theme.value === Theme.Dark);
  const isLight = computed(() => !isDark.value);
  const isRealLight = computed(() => theme.value === Theme.RealLight);
  const themeChangeDisabled = ref(() => appStore.themeChangeDisabled);

  /**
   * 加载 antd 语言文件
   * 全部语言被打包进来了
   */
  // const loadAntLocaleAsync = (locale: string): Promise<Locale> => {
  //   return import(`ant-design-vue/lib/locale/${locale.replace(/-/g, '_')}.js`).then((data) => data.default || data);
  // };

  useEffect(
    () => {
      AntLocales[i18n.locale as keyof typeof AntLocales]?.()
        .then((locales) => {
          antLocales.value = locales;
        })
        .catch((err) => {
          warn(process.env.NODE_ENV === 'production', err.message);
        });
    },
    () => i18n.locale,
  );

  return reactive({
    antLocales,
    siteLogo,
    siteTitle,
    theme,
    themeChangeDisabled,
    isDark,
    isLight,
    isRealLight,
    primaryColor,
    layout,
    supportLanguages,
    setTheme: appStore.setTheme,
    resetTheme: appStore.resetTheme,
    setThemeChangedDisabled: appStore.setThemeChangedDisabled,
    resetThemeChangeDisabled: appStore.resetThemeChangeDisabled,
    setPrimaryColor: appStore.setPrimaryColor,
    resetPrimaryColor: appStore.resetPrimaryColor,
    setColor: appStore.setColor,
    setLocale: appStore.setLocale,
    setLayout: appStore.setLayout,
  });
};
