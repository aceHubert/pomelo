import { defineComponent } from '@vue/composition-api';
import { ConfigProvider, ANT_PREFIX_CLS } from '@/components';

export default defineComponent({
  name: 'App',
  head: {
    title: '',
    titleTemplate: (title: string) => (title ? `${title} | Portal` : 'Portal'),
  },
  setup() {
    return () => (
      <ConfigProvider prefixCls={ANT_PREFIX_CLS}>
        <router-view />
      </ConfigProvider>
    );
  },
});
