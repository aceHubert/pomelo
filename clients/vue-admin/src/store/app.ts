import { defineStore } from 'pinia';
import tinycolor from 'tinycolor2';
import { ref, shallowRef } from '@vue/composition-api';
import { i18n } from '@/i18n';
import { defaultSettings } from '@/configs/settings.config';
import { STORAGE_PREFIX } from './utils';

// Types
import type { LayoutConfig, ColorConfig, LocaleConfig, Theme } from 'antdv-layout-pro/types';

export const useAppStore = defineStore(
  'app',
  () => {
    const siteTitle = defaultSettings.title;
    const siteLogo = defaultSettings.logo;

    //#region layout

    // 布局（菜单模式，固定头部，固定侧边栏等）
    const layout = shallowRef({ ...defaultSettings.layout });

    // 主题（主题色，dark/light 模式等）
    const color = shallowRef({ ...defaultSettings.color });

    /**
     * 设置布局（使用缓存到本地）
     */
    const setLayout = (layoutConfig: Partial<LayoutConfig>) => {
      layout.value = { ...layout.value, ...layoutConfig };
    };

    /**
     * 设置主题颜色（使用缓存到本地）
     */
    const setColor = (colorVal: Partial<ColorConfig>) => {
      if (colorVal.primaryColor && !new tinycolor(colorVal.primaryColor).isValid()) {
        delete colorVal.primaryColor;
      }
      color.value = { ...color.value, ...colorVal };
      colorVal.primaryColor && (primaryColor.value = colorVal.primaryColor);
      colorVal.theme && (theme.value = colorVal.theme);
      // storage.set(COLOR_KEY, color.value);
    };

    const theme = ref(color.value.theme);
    const themeChangeDisabled = ref(false);
    /**
     * 设置 theme（不会缓存，如需要缓存请使用 setColor）
     */
    const setTheme = (themeVal: Theme) => {
      theme.value = themeVal;
    };
    /**
     * 重置成默认 theme
     */
    const resetTheme = () => {
      theme.value = color.value.theme;
    };

    /**
     * 设置 theme change disabled
     */
    const setThemeChangedDisabled = (flag: boolean) => {
      themeChangeDisabled.value = flag;
    };
    /**
     * 重置成默认 theme change disabled
     */
    const resetThemeChangeDisabled = () => {
      themeChangeDisabled.value = false;
    };

    const primaryColor = ref(color.value.primaryColor);
    /**
     * 设置 primary color（不会缓存，如需要缓存请使用 setColor）
     */
    const setPrimaryColor = (color: string) => {
      if (color && new tinycolor(color).isValid()) {
        primaryColor.value = color;
      }
    };

    /**
     * 重置成默认 primary color
     */
    const resetPrimaryColor = () => {
      primaryColor.value = color.value.primaryColor;
    };

    //#endregion

    //#region locale

    const locale = ref(defaultSettings.language.locale);

    /**
     * 支持的语言
     */
    const supportLanguages = shallowRef(defaultSettings.language.supportLanguages);

    /**
     * 设置支持的语言
     */
    const setSupportLanguages = (languages: LocaleConfig[]) => {
      supportLanguages.value = languages;
    };

    /**
     * 设置语言（使用缓存到本地）
     */
    const setLocale = (userLocale: string) => {
      const { locale: newLocale } =
        supportLanguages.value.find((lang) => lang.locale === userLocale || lang.alternate === userLocale) || {};

      if (newLocale) {
        locale.value = newLocale;
        // 修改 i18n 的 locale
        newLocale !== i18n.locale && (i18n.locale = newLocale);
      }
    };

    //#endregion

    return {
      siteTitle,
      siteLogo,
      locale,
      supportLanguages,
      layout,
      // color, // color 不导出，通过 theme / primaryColor 获取
      theme,
      themeChangeDisabled,
      primaryColor,
      setLocale,
      setSupportLanguages,
      setLayout,
      setColor,
      setTheme,
      resetTheme,
      setThemeChangedDisabled,
      resetThemeChangeDisabled,
      setPrimaryColor,
      resetPrimaryColor,
    };
  },
  {
    persist: {
      key: `${STORAGE_PREFIX}/app-store`,
      paths: ['layout', 'theme', 'primaryColor', 'locale'],
      afterRestore: (ctx) => {
        // 初始设置 locale (从缓存中读取)
        ctx.store.setLocale(ctx.store.locale);
        ctx.store.setTheme(ctx.store.theme);
        ctx.store.setPrimaryColor(ctx.store.primaryColor);
        ctx.store.setLayout(ctx.store.layout);
      },
    },
  },
);
