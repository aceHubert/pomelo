import { defineComponent, PropType } from '@vue/composition-api';
// import { Drawer } from 'ant-design-vue';

// Types
import { LayoutConfig, ColorConfig } from '@/types';

export default defineComponent({
  name: 'SettingDrawer',
  props: {
    getContainer: { type: Function },
    configs: { type: Object as PropType<LayoutConfig & ColorConfig>, default: () => ({}) },
    /** 多语言 */
    i18nRender: {
      type: Function as PropType<(key: string, fallback: string) => string>,
      default: (key: string, fallback: string) => fallback,
    },
  },
  setup() {
    // const show = ref(false);

    return () => (
      <div></div>
      //   <Drawer
      //     vModel={show.value}
      //     width="300"
      //     // getContainer={props.getContainer}
      //     placement="right"
      //     onClose={() => (show.value = false)}
      //   ></Drawer>
    );
  },
});
