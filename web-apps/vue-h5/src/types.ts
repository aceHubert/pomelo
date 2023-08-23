import { defineComponent } from '@vue/composition-api';

class Helper<Props> {
  Return = defineComponent({} as { props: Record<keyof Props, any> });
}
export type DefineComponent<Props> = Helper<Props>['Return'];

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
