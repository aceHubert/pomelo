import { defineComponent } from '@vue/composition-api';
import { Alert, Icon } from 'ant-design-vue';
import { useI18n } from '@/hooks';
import classes from './index.module.less';

export default defineComponent({
  name: ' Taxonomy',
  head() {
    return {
      title: this.$tv('page_taxonomy.title', '类别') as string,
    };
  },
  props: {
    id: String,
  },
  setup(props) {
    const i18n = useI18n();

    return () => (
      <div class={[classes.container]}>
        <Alert
          message={i18n.tv('page_taxonomy.alert.message', `类别：${props.id}`, { id: props.id })}
          type="info"
          show-icon
        >
          <Icon slot="icon" type="smile" />
        </Alert>
      </div>
    );
  },
});
