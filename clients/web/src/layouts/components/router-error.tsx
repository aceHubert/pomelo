import { defineComponent, computed } from '@vue/composition-api';
import { Card, Result } from 'ant-design-vue';

export default defineComponent({
  name: 'RouterError',
  props: {
    error: Object,
  },
  setup(props) {
    const statusCode = computed(() => props.error?.statusCode || 500);
    const message = computed(() => props.error?.message || 'An error occurred!');

    return () => (
      <Card bordered={false} size="small">
        <Result status="error" title={`Error(${statusCode.value})`} subTitle={message.value}></Result>
      </Card>
    );
  },
});
