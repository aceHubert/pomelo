import { defineComponent } from '@vue/composition-api';
import { Result } from 'ant-design-vue';
import { useI18n } from '@/composables';

export default defineComponent({
  name: 'PageNotFound',
  head() {
    return {
      title: this.$tv('forbidden.page_title', '禁止访问') as string,
    };
  },
  anonymous: true,
  layout: 'blank',
  setup() {
    const i18n = useI18n();

    return () => (
      <Result
        status="error"
        title={i18n.tv('forbidden.title', '错误')}
        subTitle={i18n.tv('forbidden.subtitle', '您没有权限访问，如有疑问请联系管理员！')}
        style="background-color: var(--component-background); min-height: 100%;"
      >
        <template slot="extra">
          <router-link to={{ name: 'signout' }}>{i18n.tv('forbidden.switch_account', '切换账号')}</router-link>
        </template>
      </Result>
    );
  },
});
