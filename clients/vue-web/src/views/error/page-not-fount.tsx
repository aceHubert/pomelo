import { defineComponent } from '@vue/composition-api';
import { Result } from 'ant-design-vue';
import { useI18n } from '@/hooks';

export default defineComponent({
  name: 'PageNotFound',
  head() {
    return {
      title: this.$tv('page_not_found.page_title', '页面未找到') as string,
    };
  },
  anonymous: true,
  layout: 'blank',
  setup() {
    const i18n = useI18n();

    return () => (
      <Result
        status="error"
        title={i18n.tv('page_not_found.title', '错误')}
        subTitle={i18n.tv('page_not_found.subtitle', '页面未找到！')}
        style="background-color: var(--component-background); min-height: 100%;"
      >
        <template slot="extra">
          <router-link to="/">{i18n.tv('page_not_found.go_home_btn_text', '返回首页')}</router-link>
        </template>
      </Result>
    );
  },
});
