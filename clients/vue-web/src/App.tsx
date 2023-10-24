import { defineComponent } from '@vue/composition-api';
import { Theme, ConfigProvider, useDeviceMixin } from '@pomelo/shared-client';
import { ANT_PREFIX_CLS } from '@/components';

export default defineComponent({
  name: 'App',
  head: {
    title: '',
    titleTemplate: (title: string) => title || 'Pomelo',
  },
  setup() {
    const deviceMixin = useDeviceMixin();

    return () => (
      <ConfigProvider prefixCls={ANT_PREFIX_CLS} theme={Theme.Light} primaryColor="#fa541c" device={deviceMixin.device}>
        <router-view />
      </ConfigProvider>
    );
  },
});
