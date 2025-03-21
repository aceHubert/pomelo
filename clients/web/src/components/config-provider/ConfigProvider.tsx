import { defineComponent, watch, onMounted, onBeforeUnmount } from '@vue/composition-api';
import { ConfigProvider as AntConfigProvider } from 'ant-design-vue';
import { DeviceType } from '@/types';
import { removeClass, addClass, genColor, addCssText, removeCssText } from './utils';

// Types
import type { PropType } from '@vue/composition-api';
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
  theme: 'light' | 'dark';
  primaryColor: string;
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
      default: 'light',
    },
    primaryColor: {
      type: String,
      default: '#1890ff',
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
  watch: { ...getWatch(['theme', 'primaryColor', 'device', 'i18nRender']) },
  setup(props) {
    let dispose: (() => void) | undefined;

    onMounted(() => {
      let removeClasses: string[] = [];
      const styleProviderId = 'style-provider';

      const unWatchToggleClass = watch(
        [() => props.device, () => props.theme],
        ([device, theme]) => {
          removeClasses.length && removeClass(document.body, removeClasses.join(' '));
          const addClasses = (removeClasses = [`theme-${theme}`, `is-${device}`]);
          addClass(document.body, addClasses.join(' '));
        },
        {
          immediate: true,
        },
      );

      const unWatchCssVariable = watch(
        [() => props.primaryColor, () => props.theme],
        ([primaryColor, theme]) => {
          const colors = genColor(primaryColor, { isDark: theme === 'dark' });
          addCssText(
            `:root .theme-${theme} {\n${Object.keys(colors)
              .map((key) =>
                key === 'base' ? `  --theme-primary: ${colors[key]};` : `  --theme-${key}: ${colors[key]};`,
              )
              .concat([`  --theme-random: ${Math.random()};`])
              .join('\n')}\n}`,
            styleProviderId,
          );
        },
        {
          immediate: true,
        },
      );

      dispose = () => {
        unWatchToggleClass();
        unWatchCssVariable();
        removeClass(document.body, removeClasses.join(' '));
        removeCssText(styleProviderId);
      };
    });

    onBeforeUnmount(() => {
      dispose?.();
    });

    return {};
  },
}) as DefineComponent<ConfigProviderProps>;
