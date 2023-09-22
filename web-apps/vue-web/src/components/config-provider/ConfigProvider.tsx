import { defineComponent, watch, onMounted, onBeforeUnmount } from 'vue-demi';
import { ConfigProvider as AntConfigProvider } from 'ant-design-vue';
import { Theme, DeviceType } from '@/types';
import { removeClass, addClass } from './util';

// Types
import type { PropType } from 'vue-demi';
import type { CSPConfig } from 'ant-design-vue/types/config-provider';
import type { Locale } from 'ant-design-vue/types/locale-provider';
import type { DefineComponent } from '../../types';

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
  theme: Theme;
  device: DeviceType;
  i18nRender: (key: string, fallback: string, values?: Record<string, any>) => string;
};

function getWatch(this: any, keys: string[] = []) {
  const watch: Record<string, any> = {};
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
      default: Theme.Light,
    },
    device: {
      type: String,
      default: DeviceType.Desktop,
    },
    i18nRender: {
      type: Function as PropType<ConfigProviderProps['i18nRender']>,
      default: (key: string, fallback: string) => fallback,
    },
  },
  watch: { ...getWatch(['theme', 'device', 'i18nRender']) },
  setup(props) {
    let dispose: (() => void) | undefined;

    onMounted(() => {
      let removeClasses: string[] = [],
        addClasses: string[] = [];

      const unWatch = watch(
        [() => props.device, () => props.theme],
        ([device, theme]) => {
          removeClasses.length && removeClass(document.body, removeClasses.join(' '));
          addClasses = removeClasses = [`theme-${theme}`, `is-${device}`];
          addClass(document.body, addClasses.join(' '));
        },
        {
          immediate: true,
        },
      );

      dispose = () => {
        unWatch();
        removeClass(document.body, removeClasses.join(' '));
      };
    });

    onBeforeUnmount(() => {
      dispose?.();
    });

    return {};
  },
}) as DefineComponent<ConfigProviderProps>;
