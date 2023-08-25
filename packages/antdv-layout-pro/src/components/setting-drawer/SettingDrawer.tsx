import { defineComponent, type PropType } from 'vue-demi';
// import { Drawer } from 'ant-design-vue';
// import { useConfigProvider } from '../hooks';

// Types
import type { LayoutConfig, ColorConfig } from '../../types';

export default defineComponent({
  name: 'SettingDrawer',
  props: {
    getContainer: { type: Function },
    configs: { type: Object as PropType<LayoutConfig & ColorConfig>, default: () => ({}) },
  },
  setup() {
    // const configProvider = useConfigProvider();
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
