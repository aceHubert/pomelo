import { defineComponent } from '@vue/composition-api';
import { Alert, Icon } from 'ant-design-vue';
import { useI18n } from '@/hooks';
import classes from './index.module.less';

export default defineComponent({
  name: 'Tag',
  head() {
    return {
      title: this.$tv('page_tag.title', '标签') as string,
    };
  },
  setup() {
    const i18n = useI18n();

    return () => (
      <div class={[classes.container]}>
        <Alert message={i18n.tv('page_tag.alert.message', '标签')} type="info" show-icon>
          <Icon slot="icon" type="smile" />
        </Alert>
      </div>
    );
  },
});
