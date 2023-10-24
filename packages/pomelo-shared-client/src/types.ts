import { defineComponent } from 'vue-demi';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
export type OmitVue<T> = Partial<Omit<T, keyof Vue>>;

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
