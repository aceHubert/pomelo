import { defineComponent, computed } from '@vue/composition-api';
import { Button, Card, Result } from 'ant-design-vue';
import { useI18n, useUserManager } from '@/composables';

export default defineComponent({
  name: 'RouterError',
  props: {
    error: Object,
  },
  setup(props) {
    const i18n = useI18n();
    const userManager = useUserManager();

    const statusCode = computed(() => props.error?.statusCode || 500);
    const message = computed(() => props.error?.message || 'An error occurred!');

    const handleSignin = () => {
      userManager
        .signin({
          noInteractive: true,
          // popup: true,
        })
        .then(() => {
          window.location.reload();
        });
    };

    return () => (
      <Card bordered={false} size="small">
        <Result status="error" title={`Error(${statusCode.value})`} subTitle={message.value}>
          <template slot="extra">
            {statusCode.value === 401 && (
              <Button type="primary" rounded onClick={() => handleSignin()}>
                {i18n.tv('unauthorized.signin_btn_text', '重新登录')}
              </Button>
            )}
          </template>
        </Result>
      </Card>
    );
  },
});
