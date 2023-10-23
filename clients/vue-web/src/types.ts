import { defineComponent } from '@vue/composition-api';

// Types
import type { ComponentOptions } from 'vue';

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

export enum Theme {
  /**
   * Header 深色，Sider 浅色
   */
  Light = 'light',
  /**
   * 深色
   */
  Dark = 'dark',
}

export enum DeviceType {
  Desktop = 'desktop',
  Tablet = 'tablet',
  Mobile = 'mobile',
}
