import { LayoutConfig, ColorConfig, Layout, Theme, ContentWidth } from '@/types';

// save to localStorage
export const LOCALE_KEY = 'locale';
export const LAYOUT_KEY = 'layout';
export const COLOR_KEY = 'color';

export const defaultSettings: {
  layout: LayoutConfig;
  color: ColorConfig;
} = {
  // pwa: false,
  // iconfontUrl: '',
  layout: {
    title: (i18nRender: (key: string, fallback: string, args?: any) => string) => i18nRender('site_title', 'Pomelo'),
    logo: `${process.env.BASE_URL}static/images/logo.png`,
    layout: Layout.MixedMenu,
    contentWidth: ContentWidth.Fluid,
    fixedHeader: true,
    fixSiderbar: true,
    sideCollapsed: 'auto',
    colorWeak: false,
    autoHideHeader: false,
    multiTab: false,
  },
  color: {
    theme: Theme.Light,
    primaryColor: '#e94709',
  },
};
