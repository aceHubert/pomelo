import { LayoutType, Theme, ContentWidth, type LayoutConfig, type ColorConfig } from 'antdv-layout-pro/types';

// Types
import type { LocaleConfig } from '@/types';

export const defaultSettings: {
  /**
   * 站点标题
   */
  title: string | ((i18nRender: (key: string, fallback: string, args?: any) => string) => string);
  /**
   * 站点 Logo
   * URL, svg, icon components
   */
  logo: any;
  /**
   * 布局配置
   */
  layout: LayoutConfig;
  /**
   * 颜色配置
   */
  color: ColorConfig;
  /**
   * 语言配置
   */
  language: {
    locale: string;
    supportLanguages: LocaleConfig[];
  };
} = {
  // pwa: false,
  // iconfontUrl: '',
  title: (i18nRender: (key: string, fallback: string, args?: any) => string) =>
    i18nRender('site_title', 'Pomelo Admin'),
  logo: `${process.env.BASE_URL}static/images/logo.png`,
  layout: {
    type: LayoutType.SiderMenu,
    contentWidth: ContentWidth.Fluid,
    fixedHeader: true,
    fixSiderbar: true,
    sideCollapsed: 'disabled',
    colorWeak: false,
    autoHideHeader: false,
    multiTab: false,
  },
  color: {
    theme: Theme.Light,
    primaryColor: '#FA541C',
  },
  language: {
    locale: 'zh-CN',
    supportLanguages: [
      {
        name: 'English',
        shortName: 'EN',
        icon: '🇺🇸',
        locale: 'en-US',
      },
      {
        name: '简体中文',
        shortName: '中',
        icon: '🇨🇳',
        locale: 'zh-CN',
      },
    ],
  },
};
