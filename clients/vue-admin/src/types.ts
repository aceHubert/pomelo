import { defineComponent } from '@vue/composition-api';

// Types
import type { ComponentOptions } from 'vue';
import type Vue from 'vue';

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
