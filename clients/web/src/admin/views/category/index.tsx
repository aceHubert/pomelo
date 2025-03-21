import { defineComponent } from '@vue/composition-api';
import { Alert, Icon } from 'ant-design-vue';
import { useI18n } from '@/composables';
import classes from './index.module.less';

export default defineComponent({
  name: 'TaxonomyCategory',
  head() {
    return {
      title: this.$tv('page_category.title', '类别') as string,
    };
  },
  setup() {
    const i18n = useI18n();

    return () => (
      <div class={[classes.container]}>
        <Alert message={i18n.tv('page_category.alert.message', '类别')} type="info" show-icon>
          <Icon slot="icon" type="smile" />
        </Alert>
      </div>
    );
  },
});
