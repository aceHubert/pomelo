import { upperFirst } from 'lodash-es';
import { defineComponent } from '@vue/composition-api';
import { ConfigProvider } from 'antdv-layout-pro';
import { useAppMixin, useDeviceMixin } from '@/mixins';
import { useI18n, expose } from '@/hooks';
import { Spin, ANT_PREFIX_CLS } from '@/components';
import { loadingRef } from '@/shared';
import { Theme } from '@/types';
import { RouterView } from './components';
import classes from './styles/blank.module.less';

export default defineComponent({
  name: 'BlankLayout',
  head() {
    const themeVars = (this.themeVars as Record<string, string>) ?? {};
    let cssText = '';
    for (const key in themeVars) {
      cssText += `--theme-${key}: ${themeVars[key]} !important;`;
    }
    cssText = `body {${cssText}}`;
    return {
      style: [
        {
          vmid: 'pomelo-theme-vars',
          cssText,
        },
      ],
    };
  },
  setup() {
    const appMixin = useAppMixin();
    const deviceMixin = useDeviceMixin();
    const i18n = useI18n();

    expose({
      themeVars: appMixin.getThemeVars(Theme.Light),
    });

    return () => (
      <ConfigProvider
        locale={appMixin.antLocales}
        prefixCls={ANT_PREFIX_CLS}
        theme={Theme.Light}
        device={deviceMixin.device}
        i18nRender={(...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string}
      >
        {
          // device 变化重新渲染导致 wujie Vue组件初始化使用 Promise 执行$refs找不到问题
          deviceMixin.device && (
            <div class={[classes.layoutContentWrapper, classes[`contentWidth${upperFirst(appMixin.contentWidth)}`]]}>
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
