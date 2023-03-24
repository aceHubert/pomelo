import { defineComponent } from '@vue/composition-api';
import { useI18n } from '@/i18n';

export default defineComponent({
  name: 'Home',
  setup() {
    const i18n = useI18n();

    return () => (
      <div class="text-center py-10">
        <p> {i18n.tv('page_home.tips', '企业模块站点，如有疑问请联系管理员！')}</p>
      </div>
    );
  },
});
