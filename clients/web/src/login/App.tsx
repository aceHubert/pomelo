import { defineComponent, computed } from '@vue/composition-api';
import { OptionPresetKeys } from '@ace-pomelo/shared/client';
import { ConfigProvider } from '@/components/config-provider';
import { Spin, ANT_PREFIX_CLS } from '@/components/antdv-helper';
import { useI18n, useOptions } from '@/composables';
import { useDeviceMixin } from '@/mixins/device';
import { useAppStore } from '@/store/app';
import { loadingRef } from '@/shared';

export default defineComponent({
  name: 'App',
  head() {
    const siteTitle = this.siteTitle as string;
    const siteDescription = this.siteDescription as string;
    return {
      title: '',
      titleTemplate: (title: string) => (title ? `${title} | ${siteTitle}` : siteTitle),
      meta: [
        {
          name: 'description',
          content: siteDescription,
        },
      ],
    };
  },
  setup() {
    const { siteTitle: title, supportLanguages, setLocale } = useAppStore();
    const blogName = useOptions(OptionPresetKeys.BlogName);
    const blogDescription = useOptions(OptionPresetKeys.BlogDescription);
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();

    const siteTitle = computed(() => {
      if (blogName.value) {
        return blogName.value;
      } else if (typeof title === 'function') {
        return title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string);
      }
      return title;
    });

    const deviceType = computed(() => {
      return deviceMixin.device;
    });

    const locale = computed(() => {
      return i18n.locale;
    });

    return {
      siteTitle,
      siteDescription: blogDescription,
      supportLanguages,
      deviceType,
      locale,
      setLocale,
    };
  },
  render() {
    return (
      <ConfigProvider
        prefixCls={ANT_PREFIX_CLS}
        primaryColor="#8252ab"
        device={this.deviceType}
        i18nRender={(...args: [string, string, Record<string, string>]) => this.$tv(...args) as string}
      >
        <div class="app-content__wrapper content-width-fixed" lang={this.locale}>
          <Spin
            class="app-content__loading"
            spinning={loadingRef.value}
            tip={this.$tv('common.tips.loading_text', 'Loading...')}
          ></Spin>
          <ul class="locales">
            {this.supportLanguages.map((lang) => (
              <li
                class={['locale-item', { selected: lang.locale === this.$i18n.locale }]}
                onClick={() => this.setLocale(lang.locale)}
              >
                {lang.shortName}
              </li>
            ))}
          </ul>
          <router-view />
        </div>
      </ConfigProvider>
    );
  },
});
