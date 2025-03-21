import { defineComponent } from '@vue/composition-api';
import { ConfigProvider, Spin, ANT_PREFIX_CLS } from '@/components';
import { useAppMixin, useDeviceMixin } from '@/mixins';
import { useI18n } from '@/composables';
import { loadingRef } from '@/shared';
import { RouterView } from './components';
import classes from './default.module.less';

export default defineComponent({
  name: 'BefaultLayout',
  setup() {
    const appMixin = useAppMixin();
    const deviceMixin = useDeviceMixin();
    const i18n = useI18n();

    return () => (
      <ConfigProvider
        locale={appMixin.antLocales}
        prefixCls={ANT_PREFIX_CLS}
        theme={appMixin.theme}
        primaryColor={appMixin.primaryColor}
        device={deviceMixin.device}
        i18nRender={(...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string}
      >
        <div class={classes.layoutContentWrapper}>
          <Spin
            class={classes.layoutContentLoading}
            spinning={loadingRef.value}
            tip={i18n.tv('common.tips.loading_text', 'Loading...')}
          ></Spin>
          <RouterView />
        </div>
      </ConfigProvider>
    );
  },
});
