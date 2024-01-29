import tinycolor from 'tinycolor2';
import { defineStore } from 'pinia';
import { ref, shallowRef } from '@vue/composition-api';
import { warn } from '@ace-util/core';
import { i18n, supportLanguages as i18nSupportLanguages } from '@/i18n';
import { defaultSettings } from '@/configs/settings.config';

// Types
import type { ColorConfig, LocaleConfig } from '../types';

export const useAppStore = defineStore('app', () => {
  const siteTitle = defaultSettings.title;
  const siteLogo = defaultSettings.logo;

  //#region layout

  // 主题（主题色，dark/light 模式等）
  const color = shallowRef<ColorConfig>({ ...defaultSettings.color });

  const theme = ref(color.value.theme);
  const primaryColor = ref(color.value.primaryColor);

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

  /**
   * 设置 theme（不会缓存，如需要缓存请使用 setColor）
   */
  const setTheme = (themeVal: ColorConfig['theme']) => {
    theme.value = themeVal;
  };

  /**
   * 设置 primary color（不会缓存，如需要缓存请使用 setColor）
   */
  const setPrimaryColor = (color: string) => {
    if (color && new tinycolor(color).isValid()) {
      primaryColor.value = color;
    }
  };

  //#endregion

  //#region locale

  const locale = ref(i18n.locale);

  /**
   * 支持的语言
   */
  const supportLanguages = shallowRef(i18nSupportLanguages);

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
    const newLocale = supportLanguages.value.find(
      (lang) => lang.locale === userLocale || lang.alternate === userLocale,
    )?.locale;

    if (newLocale) {
      locale.value = newLocale;
      // 修改 i18n 的 locale
      newLocale !== i18n.locale && (i18n.locale = newLocale);
    } else {
      warn(
        process.env.NODE_ENV === 'production',
        `[appStore] setLocale: locale ${userLocale} not found, reset i18n.locale to ${locale.value}`,
      );
      i18n.locale = locale.value;
    }
  };

  //#endregion

  return {
    siteTitle,
    siteLogo,
    // color, // color 不导出，通过 theme / primaryColor 获取
    theme,
    primaryColor,
    locale,
    supportLanguages,
    setColor,
    setTheme,
    setPrimaryColor,
    setLocale,
    setSupportLanguages,
  };
});
