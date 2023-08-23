import { defineComponent } from '@vue/composition-api';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
export type OmitVue<T> = Partial<Omit<T, keyof Vue>>;

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
