import { upperFirst, kebabCase } from 'lodash-es';
import { defineComponent, toRef } from '@vue/composition-api';
import { useAppMixin, useDeviceMixin } from '@/mixins';
import { useI18n } from '@/hooks';
import { ConfigProvider, Spin, expose, ANT_PREFIX_CLS } from '@/components';
import { loadingRef } from '@/shared';
import { RouterView } from './modules';
import classes from './styles/blank.module.less';

// Types
import { Ref } from '@vue/composition-api';
import { Theme, DeviceType } from '@/types';

export default defineComponent({
  name: 'BlankLayout',
  head() {
    const device = (this.device as Ref<DeviceType>).value ?? DeviceType.Desktop;
    const theme = (this.theme as Ref<Theme>).value ?? Theme.Light;
    const themeVars = (this.themeVars as Ref<Record<string, string>>).value ?? {};
    let cssText = '';
    for (const key in themeVars) {
      cssText += `--theme-${kebabCase(key)}: ${themeVars[key]};`;
    }
    cssText = `:root {${cssText}}`;
    return {
      bodyAttrs: {
        class: `theme-${theme} is-${device}`,
      },
      style: [
        {
          vmid: 'theme-vars',
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
      device: toRef(deviceMixin, 'device'),
      theme: toRef(appMixin, 'theme'),
      themeVars: toRef(appMixin, 'themeVars'),
    });

    const renderContent = () => {
      return (
        <div
          id="layout-blank"
          class={[classes.layoutContentWrapper, classes[`contentWidth${upperFirst(appMixin.contentWidth)}`]]}
        >
          <Spin
            class={classes.layoutContentLoading}
            spinning={loadingRef.value}
            tip={i18n.tv('common.tips.loading_text', 'Loading...')}
          ></Spin>
          <RouterView />
        </div>
      );
    };

    return () => (
      <ConfigProvider
        attrs={{
          locale: appMixin.antLocales,
          prefixCls: ANT_PREFIX_CLS,
        }}
        theme={appMixin.theme}
        device={deviceMixin.device}
        i18nRender={(...args) => i18n.tv(...args) as string}
      >
        {renderContent()}
      </ConfigProvider>
    );
  },
});
