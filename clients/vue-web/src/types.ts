import { defineComponent } from '@vue/composition-api';
import type { ComponentOptions } from 'vue';
import type Vue from 'vue';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

export type Plugin = (context: { app: ComponentOptions<Vue> }, inject: (key: string, value: any) => void) => void;

export enum DeviceType {
  Desktop = 'desktop',
  Tablet = 'tablet',
  Mobile = 'mobile',
}

/**
 * Theme
 */
export interface ColorConfig {
  /**
   * 主题
   */
  theme: 'light' | 'dark';
  /**
   * 主题色
   */
  primaryColor: string;
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
