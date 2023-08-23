import { defineComponent } from '@vue/composition-api';
import { ConfigProvider as AntConfigProvider } from 'ant-design-vue';

// Types
import type { PropType } from '@vue/composition-api';
import type { CSPConfig } from 'ant-design-vue/types/config-provider';
import type { Locale } from 'ant-design-vue/types/locale-provider';

export type ConfigProviderProps = {
  prefixCls?: string;
  locale?: Locale;
  csp?: CSPConfig;
  autoInsertSpaceInButton?: boolean;
  pageHeader?: object;
  getPopupContainer?: (triggerNode: HTMLElement, dialogContext?: Vue | null) => HTMLElement;
  getPrefixCls: (suffixCls: string, customizePrefixCls?: string) => string;
  transformCellText?: Function;
  renderEmpty: Function;
  theme: string;
  device: string;
  i18nRender: (key: string, fallback: string, values?: Record<string, any>) => string;
};

function getWatch(this: any, keys: string[] = []) {
  const watch: Dictionary<any> = {};
  keys.forEach((k) => {
    watch[k] = function (value: any) {
      this._proxyVm._data[k] = value;
    };
  });
  return watch;
}

export default defineComponent({
  name: 'ConfigProvider',
  mixins: [AntConfigProvider],
  props: {
    theme: {
      type: String,
      default: 'light',
    },
    device: {
      type: String,
      default: 'desktop',
    },
    i18nRender: {
      type: Function as PropType<ConfigProviderProps['i18nRender']>,
      default: (key: string, fallback: string) => fallback,
    },
  },
  watch: { ...getWatch(['theme', 'device', 'i18nRender']) },
});
