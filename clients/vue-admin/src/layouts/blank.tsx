import { upperFirst } from 'lodash-es';
import { defineComponent } from '@vue/composition-api';
import { ConfigProvider } from 'antdv-layout-pro';
import { useAppMixin, useDeviceMixin } from '@/mixins';
import { useI18n } from '@/hooks';
import { Spin, ANT_PREFIX_CLS } from '@/components';
import { loadingRef } from '@/shared';
import { RouterView } from './components';
import classes from './blank.module.less';

export default defineComponent({
  name: 'BlankLayout',
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
        i18nRender={(...args: [string, string, Record<string, string>]) => i18n.tv(...args) as string}
      >
        {
          // device 变化重新渲染导致 wujie Vue组件初始化使用 Promise 执行$refs找不到问题
          deviceMixin.device && (
            <div
              class={[classes.layoutContentWrapper, classes[`contentWidth${upperFirst(appMixin.layout.contentWidth)}`]]}
            >
              <Spin
                class={classes.layoutContentLoading}
                spinning={loadingRef.value}
                tip={i18n.tv('common.tips.loading_text', 'Loading...')}
              ></Spin>
              <RouterView />
            </div>
          )
        }
      </ConfigProvider>
    );
  },
});
