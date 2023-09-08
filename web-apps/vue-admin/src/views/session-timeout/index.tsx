import { defineComponent } from '@vue/composition-api';
import { Button } from 'ant-design-vue';
import { useUserManager, useI18n } from '@/hooks';
import classes from './index.module.less';

export default defineComponent({
  name: 'SessionTimeout',
  layout: 'blank',
  head() {
    return {
      title: this.$tv('page_session_timeout.page_title', '会话超时') as string,
    };
  },
  setup() {
    const userManager = useUserManager();
    const i18n = useI18n();

    const signin = () => {
      userManager.signin({ noInteractive: true });
    };

    return () => (
      <div class={classes.oops}>
        <div class={classes.bullshit}>
          <div class={classes.bullshitOops}>{i18n.tv('page_session_timeout.title', 'OOPS!')}</div>
          <div class={classes.bullshitInfo}>
            {i18n.tv('page_session_timeout.info', '登录会话已超时，需要您重新登录。')}
          </div>
          <Button class={classes.bullshitActionBtn} type="primary" onClick={() => signin()}>
            {i18n.tv('page_session_timeout.log_back_in', '重新登录')}
          </Button>
        </div>
      </div>
    );
  },
});
