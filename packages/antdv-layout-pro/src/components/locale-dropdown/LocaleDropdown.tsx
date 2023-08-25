import { defineComponent, computed, watch, ref } from 'vue-demi';
import { Icon, Popover, Menu } from 'ant-design-vue';
import abstractTooltipProps from 'ant-design-vue/lib/tooltip/abstractTooltipProps';
import { omit } from '@ace-util/core';
import { useConfigProvider } from '../../shared';

// Types

import type { Tooltip as TooltipProps } from 'ant-design-vue/types/tootip/tooltip';
import type { OmitVue, LocaleConfig } from '../../types';

export type LocaleDropdownProps = {
  /** 当前语言 code */
  locale?: string;
  /** 支持的语言列表，长度必须大于0 */
  supportLanguages: LocaleConfig[];
  /** customized class prefix */
  prefixCls?: string;
} & OmitVue<TooltipProps>;

const props = abstractTooltipProps();
export default defineComponent({
  name: 'LocaleDropdown',
  props: {
    ...props,
    locale: { type: String, default: 'en-US' },
    /** 支持的语言列表，长度必须大于0 */
    supportLanguages: {
      type: Array,
      required: true,
      validator: (val: LocaleConfig[]) => !!val.length,
    },
    /** customized class prefix */
    prefixCls: String,
  },
  emits: ['change'],
  setup(props: LocaleDropdownProps, { slots, emit }) {
    const configProvider = useConfigProvider();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('locale-dropdown', customizePrefixCls);
    const popoverProps = omit(props, ['locale', 'supportLanguages', 'prefixCls', 'visible']);

    const visibleRef = ref(props.visible ?? false);

    watch(visibleRef, (value) => {
      emit('visibleChange', value);
    });

    watch(
      () => props.visible,
      (value) => {
        visibleRef.value = value ?? false;
      },
    );

    const currentLang = computed(() => {
      const lang = props.supportLanguages.find(
        (lang) => lang.locale === props.locale || lang.alternate === props.locale,
      );
      if (lang) {
        return lang;
      } else {
        return props.supportLanguages[0];
      }
    });

    const renderIcon = function renderIcon(icon: any) {
      if (icon === undefined || icon === 'none' || icon === null) {
        return null;
      }

      return typeof icon === 'object' ? (
        <Icon class="flag-icon" component={icon}></Icon>
      ) : ['.png', '.jpg', '.jpeg'].some((ext) => (icon as string).endsWith(ext)) ? (
        <img class="flag-icon" src={icon} alt="flag icon" />
      ) : (
        <span class="flag-icon">{icon}</span>
      );
    };

    return () => {
      return (
        <Popover
          vModel={visibleRef.value}
          class={`${prefixCls}-popover`}
          props={{
            ...popoverProps,
            overlayClassName: `${prefixCls}-overlay ${popoverProps?.overlayClassName ?? ''}`,
          }}
        >
          <span class={`${prefixCls}__wrapper`}>
            {slots.default ? slots.default(currentLang.value) : <Icon type="global" title={currentLang.value.name} />}
          </span>
          <template slot="content">
            <Menu
              class={`${prefixCls}-overlay__menu`}
              selectedKeys={[currentLang.value.locale]}
              onClick={({ key }: { key: string }) => {
                visibleRef.value = false;
                emit('change', key);
              }}
            >
              {props.supportLanguages.map((item) => (
                <Menu.Item key={item.locale} title={item.name}>
                  {renderIcon(item.icon)}
                  {item.name}
                </Menu.Item>
              ))}
            </Menu>
          </template>
        </Popover>
      );
    };
  },
});
