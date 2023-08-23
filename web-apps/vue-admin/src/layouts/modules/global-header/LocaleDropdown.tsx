import { defineComponent, computed, ref } from '@vue/composition-api';
import { Icon, Popover, Menu } from 'ant-design-vue';
import './styles/locale-dropdown.less';

// Types
import type { PropType } from '@vue/composition-api';
import type { Popover as PopoverProps } from 'ant-design-vue/types/popover';
import type { LocaleConfig } from '@/types';

export default defineComponent({
  name: 'LocaleDropdown',
  emits: ['change'],
  props: {
    /** 当前语言 code */
    locale: { type: String as PropType<string>, default: 'en-US' },
    /** 支持的语言列表，长度必须大于0 */
    supportLanguages: {
      type: Array as PropType<LocaleConfig[]>,
      required: true,
      validator: (val: LocaleConfig[]) => !!val.length,
    },
    /** 下拉选项显示位置 */
    placement: { type: String as PropType<PopoverProps['placement']>, default: 'bottomRight' },
  },
  setup(props, { slots, emit }) {
    const prefixCls = 'global-header-locale';

    const visibleRef = ref(false);

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

    return () => (
      <Popover
        vModel={visibleRef.value}
        class={`${prefixCls}-popover`}
        overlayClassName={`${prefixCls}-overlay`}
        placement={props.placement}
      >
        <span>
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
  },
});
