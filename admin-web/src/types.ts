import Vue, { ComponentOptions } from 'vue';
import { defineComponent } from '@vue/composition-api';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

export type Plugin = (app: ComponentOptions<Vue>, inject: (key: string, value: any) => void) => void;

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
export type OmitVue<T> = Partial<Omit<T, keyof Vue>>;

/**
 * Message
 */
export type MessageConfig = {
  title: string;
  content: string;
  to?: string;
};

/**
 * Menu
 */
export interface MenuConfig {
  /** unique key */
  key: string;
  /**
   * title
   */
  title: string | ((i18nRender: (key: string, fallback: string, args?: any) => string) => string);
  /**
   * vue-router path, resolve from name if not set
   */
  path?: string;
  alias?: string[];
  redirect?: string;
  /**
   * svg icon or antd icon type
   * https://1x.antdv.com/components/icon-cn/
   */
  icon?: any;
  /**
   * open method
   */
  target?: '_blank' | '_self';
  /**
   * parent will be invisible when there is no children
   */
  children?: MenuConfig[];
  /**
   * menu position
   */
  position?: 'top' | 'side' | 'sub';
  /**
   * 菜单中不显示
   */
  display?: false;
  /**
   * Breadcrumb 不显示
   */
  breadcrumb?: false;
}

export interface BreadcrumbCofnig {
  /**
   * unique key (from MenuConfig)
   */
  key: string;
  /**
   * path
   */
  path: string;
  /**
   * title
   */
  label: string | ((i18nRender: (key: string, fallback: string, args?: any) => string) => string);
}

/**
 * i18n
 */
export type LocaleConfig = {
  name: string;
  shortName: string;
  /**
   * svg icon or src
   */
  icon: any;
  locale: string;
  alternate?: string;
};

export enum DeviceType {
  Desktop = 'desktop',
  Tablet = 'tablet',
  Mobile = 'mobile',
}

export enum ContentWidth {
  /**
   * 100% 宽度
   */
  Fluid = 'fluid',
  /**
   * 固定宽度
   */
  Fixed = 'fixed',
}

export enum Theme {
  /**
   * Header & Sider 显示为浅色
   */
  RealLight = 'reallight',
  /**
   * Header 深色，Sider 浅色
   */
  Light = 'light',
  /**
   * 深色
   */
  Dark = 'dark',
}

export enum Layout {
  /**
   * TopMenu 显示在 Sider
   */
  SiderMenu = 'sidermenu',
  /**
   * SiderMenu 显示在 Header
   */
  TopMenu = 'topmenu',
  /**
   * menu.position 为 top 显示在 Header, 其它显示在 Sider
   */
  MixedMenu = 'mixedmenu',
  /**
   * 不显示 header
   * 菜单与SiderMenu一致
   */
  NoHeader = 'noheader',
}
/**
 * Layout
 */
export interface LayoutConfig {
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
   * 整体布局方式
   */
  layout: Layout;
  /**
   * 内容区布局
   */
  contentWidth: ContentWidth;
  /**
   * 固定 Header
   */
  fixedHeader: boolean;
  /**
   * 固定左侧菜单栏
   */
  fixSiderbar: boolean;
  /**
   * boolean 时：siderbar 默认折叠状态
   * auto 时，根据页面宽度展开/折叠
   * disabled 时，不折叠
   */
  sideCollapsed: boolean | 'auto' | 'disabled';
  /**
   * 色盲模式
   */
  colorWeak: boolean;
  /**
   * 向下滚动时，隐藏 Header
   */
  autoHideHeader: false;
  /**
   * 多 tab 页模式
   */
  multiTab: false;
}

/**
 * Theme
 */
export interface ColorConfig {
  /**
   * 主题 'dark' | 'light' | 'reallight'
   */
  theme: Theme;
  /**
   * 主题色
   */
  primaryColor: string;
}
