import { defineComponent, onMounted } from '@vue/composition-api';
import { useUserManager, useI18n } from '@/hooks';
import classes from './index.module.less';

export default defineComponent({
  name: 'SigninSilent',
  head() {
    return {
      title: this.$tv('page_signin.page_title', '登录') as string,
    };
  },
  setup() {
    const userManager = useUserManager();
    const i18n = useI18n();

    onMounted(() => {
      userManager.signinSilentCallback().catch(function (_) {
        // console.error(e)
      });
    });

    return () => (
      <div class={classes.container}>
        <p>{i18n.tv('page_signin.silent.content', '登录中...')}</p>
      </div>
    );
  },
});
