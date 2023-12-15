import { defineComponent } from '@vue/composition-api';
import { Result, Button } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
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
    const router = useRouter();
    const i18n = useI18n();

    return () => (
      <Result
        status="error"
        title={i18n.tv('page_not_found.title', '错误')}
        subTitle={i18n.tv('page_not_found.subtitle', '页面未找到！')}
      >
        <template slot="extra">
          <Button type="primary" onClick={() => router.replace('/')}>
            {i18n.tv('page_not_found.go_home_btn_text', '返回首页')}
          </Button>
        </template>
      </Result>
    );
  },
});
