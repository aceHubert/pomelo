import { defineComponent, ref } from '@vue/composition-api';
import { Card, Button, message } from 'ant-design-vue';
import { useBasicApi } from '@/fetch/apis/basic';
import { useDeviceMixin } from '@/mixins';

export default defineComponent({
  setup() {
    const basicApi = useBasicApi();
    const deviceMixin = useDeviceMixin();
    const loading = ref(false);

    const handleClearCache = async () => {
      try {
        loading.value = true;
        await basicApi.clearOptionCache();
        message.success('缓存已清除');
      } catch (error) {
        message.error('清除缓存失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <Card bordered={false} size={deviceMixin.isMobile ? 'small' : 'default'}>
        <h2>系统缓存</h2>
        <p class="text--secondary mb-5">
          清除系统缓存可以确保获取最新的配置数据。当您修改了系统配置但未立即生效时，可尝试清除缓存。
        </p>
        <Button type="primary" loading={loading.value} icon="sync" onClick={handleClearCache}>
          清除缓存
        </Button>
      </Card>
    );
  },
});
