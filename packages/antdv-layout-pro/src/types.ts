import { defineComponent } from 'vue-demi';
import type Vue from 'vue';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
export type OmitVue<T> = Partial<Omit<T, keyof Vue>>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

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
   * path
   */
  path: string;
  /**
   * alias path
   */
  alias?: string[];
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

/**
 * Breadcrumb
 */
export interface BreadcrumbConfig {
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
 * MultiTab
 */
export interface MultiTabConfig {
  path: string;
  fullPath: string;
  title: string;
  closable?: boolean;
}

/**
 * Locale
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

export enum Theme {
  /**
   * Follow the system settings
   */
  Auto = 'auto',
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

export enum LayoutType {
  /**
   * TopMenu 显示在 Sider
   * 不显示 Header
   */
  SiderMenu = 'sidermenu',
  /**
   * SiderMenu 显示在 Header
   * 不显示 Sider
   */
  TopMenu = 'topmenu',
  /**
   * menu.position 为 top 显示在 Header, 否则显示在 Sider
   */
  MixedMenu = 'mixedmenu',
}

/**
 * Layout
 */
export interface LayoutConfig {
  /**
   * 布局方式
   */
  type: LayoutType;
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
   * siderbar 展开状态
   * boolean 时，初始化折叠状态
   * auto 时，根据页面宽度展开/折叠
   * disabled: 不折叠
   */
  sideCollapsed: boolean | 'auto' | 'disabled';
  /**
   * 色盲模式
   */
  colorWeak: boolean;
  /**
   * 向下滚动时，隐藏 Header (fixedHeader: true 时有效)
   */
  autoHideHeader: boolean;
  /**
   * 多 tab 页模式
   */
  multiTab: boolean;
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

/**
 * Message
 */
export interface MessageConfig<T = any> {
  /**
   * 标题
   */
  title: string;
  /**
   * 内容
   */
  content: string;
  /**
   * href, 显示 View 按纽
   */
  to?: T;
}
