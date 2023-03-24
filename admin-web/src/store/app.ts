import { defineStore } from 'pinia';
import tinycolor from 'tinycolor2';
import { ref, shallowRef } from '@vue/composition-api';
import { i18n, supportLanguages as defaultSupportLanguages } from '@/i18n';
import { defaultSettings, LOCALE_KEY, LAYOUT_KEY, COLOR_KEY } from '@/configs/settings.config';
import { storage } from './utils/storage';

// Types
import { LocaleConfig, LayoutConfig, ColorConfig, Theme } from '@/types';

export const useAppStore = defineStore('app', () => {
  // 布局（标题，Logo等）
  const storageLayout = storage.get<Partial<LayoutConfig>>(LAYOUT_KEY, {});
  const layout = shallowRef({ ...defaultSettings.layout, ...storageLayout });

  // 主题（主题色，dark/light 模式等）
  const storageColor = storage.get<Partial<ColorConfig>>(COLOR_KEY, {});
  const color = shallowRef({ ...defaultSettings.color, ...storageColor });

  // 语言
  const supportLanguages = shallowRef<LocaleConfig[]>(defaultSupportLanguages);

  /**
   * 设置支持的语言
   */
  const setSupportLanguages = (languages: LocaleConfig[]) => {
    supportLanguages.value = languages;
  };

  /**
   * 设置布局（使用缓存到本地）
   */
  const setLayout = (layoutConfig: Partial<LayoutConfig>) => {
    layout.value = { ...layout.value, ...layoutConfig };

    // save to storage
    storage.set(LAYOUT_KEY, layout.value);
  };

  /**
   * 设置语言（使用缓存到本地）
   */
  const setLocale = (userLocale: string) => {
    const { locale: newLocale } =
      supportLanguages.value.find((lang) => lang.locale === userLocale || lang.alternate === userLocale) || {};

    if (newLocale && newLocale !== i18n.locale) {
      i18n.locale = newLocale;

      // save to storage
      storage.set(LOCALE_KEY, newLocale);
    }
  };

  const theme = ref(color.value.theme);
  const themeChangeDisabled = ref(false);
  /**
   * 设置 theme（临时，不会缓存）
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
   * 设置 primary color（临时，不会缓存）
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

    // save to storage
    storage.set(COLOR_KEY, color.value);
  };

  return {
    supportLanguages,
    layout,
    // color, // color 不导出，通过 theme / primaryColor 获取
    theme,
    themeChangeDisabled,
    primaryColor,
    setSupportLanguages,
    setLayout,
    setLocale,
    setColor,
    setTheme,
    resetTheme,
    setThemeChangedDisabled,
    resetThemeChangeDisabled,
    setPrimaryColor,
    resetPrimaryColor,
  };
});
