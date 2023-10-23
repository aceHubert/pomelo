import { defineComponent } from '@vue/composition-api';
import { ConfigProvider, ANT_PREFIX_CLS } from '@/components';
import { useDeviceMixin } from '@/mixins';

export default defineComponent({
  name: 'App',
  head: {
    title: '',
    titleTemplate: (title: string) => title || 'Portal',
  },
  setup() {
    const deviceMixin = useDeviceMixin();

    return () => (
      <ConfigProvider prefixCls={ANT_PREFIX_CLS} device={deviceMixin.device}>
        <router-view />
      </ConfigProvider>
    );
  },
});
