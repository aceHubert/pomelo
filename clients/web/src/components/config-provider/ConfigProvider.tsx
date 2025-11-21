import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from '@vue/composition-api';
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
  theme?: 'light' | 'dark';
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

    const systemTheme = ref<string>();

    onMounted(() => {
      let removeClasses: string[] = [];
      const styleProviderId = 'style-provider';

      const themeMedia = window.matchMedia('(prefers-color-scheme: light)');
      systemTheme.value = themeMedia.matches ? 'light' : 'dark';
      const onPrefersColorScheme = (e: MediaQueryListEvent): void => {
        systemTheme.value = e.matches ? 'light' : 'dark';
      };
      try {
        themeMedia.addEventListener('change', onPrefersColorScheme);
      } catch {
        try {
          themeMedia.addListener(onPrefersColorScheme);
        } catch {
          // ate by dog
        }
      }

      const unWatchToggleClass = watch(
        [() => props.device, () => props.theme, systemTheme],
        ([device, theme, systemTheme]) => {
          removeClasses.length && removeClass(document.body, removeClasses.join(' '));
          const addClasses = (removeClasses = [`theme-${theme || systemTheme}`, `is-${device}`]);
          addClass(document.body, addClasses.join(' '));
        },
        {
          immediate: true,
        },
      );

      const unWatchCssVariable = watch(
        [() => props.primaryColor, () => props.theme, systemTheme],
        ([primaryColor, theme, systemTheme]) => {
          const setTheme = theme || systemTheme;
          const colors = genColor(primaryColor, {
            isDark: setTheme === 'dark',
          });
          addCssText(
            `:root .theme-${setTheme} {\n${Object.keys(colors)
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
