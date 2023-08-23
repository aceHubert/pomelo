import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { useUserManager, useI18n } from '@/hooks';
import { useLocationMixin } from '@/mixins';
import classes from './index.module.less';

export default defineComponent({
  name: 'Signin',
  head() {
    return {
      title: this.$tv('page_signin.page_title', '登录') as string,
    };
  },
  setup() {
    const userManager = useUserManager();
    const i18n = useI18n();
    const location = useLocationMixin();

    const message = ref(i18n.tv('page_signin.tips.waiting', '请稍后...'));

    const redirect = () => {
      message.value = document.title = i18n.tv('page_signin.tips.redirecting', '跳转中...') as string;
      location.goTo(userManager.getRedirect(), true);
    };

    onMounted(() => {
      userManager
        .signinRedirectCallback()
        .then((user) => {
          if (user == null) {
            message.value = i18n.tv('page_signin.tips.no_signin_request_pinding', '没有登录请求信息。');
          }
          //  console.debug('redirect before sigin-oidc')
          redirect();
        })
        .catch((e: Error) => {
          const msg = e.message;
          if (msg.indexOf('iat is in the future') !== -1 || msg.indexOf('exp is in the past') !== -1) {
            message.value = i18n.tv(
              'page_signin.tips.server_time_unmatch_error',
              '当前设备日期时间有误<br/>请调整为标准北京时间后重新进入',
            );
          } else {
            message.value = msg;
            setTimeout(() => {
              redirect();
            }, 2000);
          }
        });
    });

    return () => (
      <div class={classes.container}>
        <p v-html={message.value}></p>
      </div>
    );
  },
});
