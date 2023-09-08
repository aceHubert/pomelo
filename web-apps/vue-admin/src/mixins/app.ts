import { ref, shallowRef, reactive, computed } from '@vue/composition-api';
import tinycolor from 'tinycolor2';
import { warn } from '@ace-util/core';
import { useI18n, useEffect } from '@/hooks';
import { useAppStore } from '@/store';
import { Theme } from '@/types';
import { colorPalette } from './utils/colorPalette';

// Types
import type { Locale } from 'ant-design-vue/types/locale-provider';

// Ant locales, 减少打包内容
const AntLocales: Record<string, () => Promise<Locale>> = {
  'zh-CN': () => import('ant-design-vue/lib/locale/zh_CN').then((data) => data.default || data),
  'en-US': () => import('ant-design-vue/lib/locale/en_US').then((data) => data.default || data),
};

/**
 * generate primary color
 * @param colorInput color input
 * @param isDark is dark theme
 * @param mixColor mix component background color
 */
const genColor = (colorInput: tinycolor.ColorInput, isDark = false) => {
  const base = tinycolor(colorInput);
  const { h, s, l } = base.toHsl();

  if (!isDark) {
    const lighter = tinycolor({ h, s, l: 96 });
    const light = tinycolor({
      h,
      s: (s - 0.2) * 100,
      l: (l + 0.35) * 100,
    });
    const dark = tinycolor({
      h,
      s: (s - 0.2) * 100,
      l: (l - 0.1) * 100,
    });
    const darker = tinycolor({ h, s, l: 20 });
    const shadowColor = base.clone().setAlpha(0.3).toString();

    return {
      base: base.toHexString(),
      lighter: lighter.toHexString(),
      light: light.toHexString(),
      dark: dark.toHexString(),
      darker: darker.toHexString(),
      lighten5: colorPalette(base, 1),
      lighten4: colorPalette(base, 2),
      lighten3: colorPalette(base, 3),
      lighten2: colorPalette(base, 4),
      lighten1: colorPalette(base, 5),
      darken1: colorPalette(base, 7),
      darken2: colorPalette(base, 8),
      darken3: colorPalette(base, 9),
      darken4: colorPalette(base, 10),
      'shadow-color': shadowColor,
    };
  } else {
    const lighter = tinycolor({
      h,
      s,
      l: (l - 0.1) * 100,
    });
    const light = tinycolor({
      h,
      s: (s - 0.2) * 100,
      l: (l - 0.1) * 100,
    });
    const dark = tinycolor({
      h,
      s: (s - 0.2) * 100,
      l: (l + 0.1) * 100,
    });
    const darker = tinycolor({
      h,
      s,
      l: (l + 0.35) * 100,
    });
    const shadowColor = base.clone().setAlpha(0.3).toString();
    const mixColor = '#141414';
    const mix = (color: tinycolor.ColorInput, weight: number) =>
      tinycolor.lessMix(color, mixColor, weight).toHexString();

    return {
      base: base.toHexString(),
      lighter: mix(lighter, 75),
      light: mix(light, 75),
      dark: mix(dark, 90),
      darker: mix(darker, 90),
      lighten5: mix(colorPalette(base, 8), 15),
      lighten4: mix(colorPalette(base, 7), 25),
      lighten3: mix(base, 30),
      lighten2: mix(base, 45),
      lighten1: mix(base, 65),
      darken1: mix(colorPalette(base, 5), 90),
      darken2: mix(colorPalette(base, 4), 95),
      darken3: mix(colorPalette(base, 3), 97),
      darken4: mix(colorPalette(base, 2), 98),
      'shadow-color': shadowColor,
    };
  }
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

  const supportLanguages = computed(() => appStore.supportLanguages);

  const primaryColor = computed(() => appStore.primaryColor);
  const theme = computed(() => appStore.theme);
  const isDark = computed(() => theme.value === Theme.Dark);
  const isLight = computed(() => !isDark.value);
  const isRealLight = computed(() => theme.value === Theme.RealLight);
  const themeChangeDisabled = ref(() => appStore.themeChangeDisabled);
  const themeVars = shallowRef({});
  const getThemeVars = (theme: Theme) => {
    const colors = genColor(primaryColor.value || '#1890ff', theme === Theme.Dark);
    return Object.keys(colors).reduce(
      (prev, key) => {
        if (key === 'base') {
          prev['primary'] = colors[key];
          return prev;
        }
        prev[`primary-${key}`] = colors[key];
        return prev;
      },
      {
        random: Math.random(),
      },
    );
  };

  useEffect(() => {
    themeVars.value = getThemeVars(theme.value);
  }, [primaryColor, theme]);

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
    supportLanguages,
    ...appStore.layout,
    getThemeVars,
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
