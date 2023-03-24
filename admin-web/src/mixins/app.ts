import { ref, shallowRef, reactive, computed } from '@vue/composition-api';
import tinycolor from 'tinycolor2';
import { warn } from '@pomelo/shared-web';
import { useEffect } from '@/components';
import { useI18n } from '@/hooks';
import { useAppStore } from '@/store';
import { Layout, ContentWidth, Theme } from '@/types';

// Types
import { Locale } from 'ant-design-vue/types/locale-provider';

// Ant locales, 减少打包内容
const AntLocales: Record<string, () => Promise<Locale>> = {
  'zh-CN': () => import('ant-design-vue/lib/locale/zh_CN').then((data) => data.default || data),
  'en-US': () => import('ant-design-vue/lib/locale/en_US').then((data) => data.default || data),
};

const genColor = (colorInput: tinycolor.ColorInput) => {
  const color = tinycolor(colorInput);
  const { h, s, l } = color.toHsl();

  const base = color.toHexString();
  const dark = tinycolor({
    h,
    s: (s - 0.2) * 100,
    l: (l - 0.1) * 100,
  }).toHexString();
  const darker = tinycolor({ h, s, l: 20 }).toHexString();
  const light = tinycolor({
    h,
    s: (s - 0.2) * 100,
    l: (l + 0.35) * 100,
  }).toHexString();
  const lighter = tinycolor({ h, s, l: 96 }).toHexString();
  const shadowColor = color.clone().setAlpha(0.3).toString();
  return {
    base,
    light,
    lighter,
    dark,
    darker,
    shadowColor,
  };
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
  const siteLogo = computed(() => appStore.layout.logo);

  /**
   * Admin site title
   */
  const siteTitle = computed(() =>
    typeof appStore.layout.title === 'function'
      ? appStore.layout.title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string)
      : appStore.layout.title,
  );

  const supportLanguages = computed(() => appStore.supportLanguages);

  const theme = computed(() => appStore.theme);
  const isDark = computed(() => theme.value === Theme.Dark);
  const isLight = computed(() => !isDark.value);
  const isRealLight = computed(() => theme.value === Theme.RealLight);
  const themeChangeDisabled = ref(() => appStore.themeChangeDisabled);
  const themeVars = shallowRef({});

  const primaryColor = computed(() => appStore.primaryColor);
  useEffect(
    () => {
      if (primaryColor.value) {
        const colors = genColor(primaryColor.value);
        themeVars.value = {
          primary: colors.base,
          primaryLight: colors.light,
          primaryLighter: colors.lighter,
          primaryDark: colors.dark,
          primaryDarker: colors.darker,
          random: Math.random(),
        };
      } else {
        themeVars.value = {};
      }
    },
    () => primaryColor.value,
  );

  const layoutType = computed(() => appStore.layout.layout);
  const hasHeader = computed(() => layoutType.value !== Layout.NoHeader);
  const isMixedMenu = computed(() => layoutType.value === Layout.MixedMenu);
  const hasTopMenu = computed(() => layoutType.value === Layout.TopMenu || layoutType.value === Layout.MixedMenu);
  const hasSiderMenu = computed(
    () =>
      layoutType.value === Layout.NoHeader ||
      layoutType.value === Layout.SiderMenu ||
      layoutType.value === Layout.MixedMenu,
  );
  const fixedHeader = computed(() => appStore.layout.fixedHeader);
  const fixSiderbar = computed(() => appStore.layout.fixSiderbar);
  const sideCollapsed = computed(() => appStore.layout.sideCollapsed);
  const contentWidth = computed(() =>
    layoutType.value === Layout.SiderMenu ? ContentWidth.Fluid : appStore.layout.contentWidth,
  );
  const colorWeak = computed(() => appStore.layout.colorWeak);
  const autoHideHeader = computed(() => appStore.layout.autoHideHeader);
  const multiTab = computed(() => appStore.layout.multiTab);

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
    themeVars,
    themeChangeDisabled,
    isDark,
    isLight,
    isRealLight,
    primaryColor,
    layoutType,
    isMixedMenu,
    hasHeader,
    hasTopMenu,
    hasSiderMenu,
    fixedHeader,
    fixSiderbar,
    sideCollapsed,
    contentWidth,
    colorWeak,
    autoHideHeader,
    multiTab,
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
