import { defineComponent } from '@vue/composition-api';
import { Alert, Icon } from 'ant-design-vue';
import { useI18n } from '@/hooks';
import classes from './index.module.less';

export default defineComponent({
  name: 'Dashboard',
  head() {
    return {
      title: this.$tv('page_dashboard.title', '仪表盘') as string,
    };
  },
  setup() {
    const i18n = useI18n();

    return () => (
      <div class={[classes.container]}>
        <Alert message={i18n.tv('page_dashboard.alert.message', '综合管理系统(IMPS)')} banner>
          <Icon slot="icon" type="smile" />
          <ul slot="description" class="pl-5 text--secondary">
            <li>{i18n.tv('page_dashboard.alert.description.form_template', '表单模版')}</li>
            <li>{i18n.tv('page_dashboard.alert.description.page_template', '页面模版')}</li>
            <li>{i18n.tv('page_dashboard.alert.description.post_template', '内容管理')}</li>
            <li>{i18n.tv('page_dashboard.alert.description.data_scope', '数据范围管理')}</li>
            <li>{i18n.tv('page_dashboard.alert.description.module_template', '模块管理')}</li>
          </ul>
        </Alert>
      </div>
    );
  },
});
