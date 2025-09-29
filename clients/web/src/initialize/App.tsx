import { defineComponent, computed } from '@vue/composition-api';
import { ConfigProvider } from '@/components/config-provider';
import { Spin, ANT_PREFIX_CLS } from '@/components/antdv-helper';
import { useI18n } from '@/composables';
import { useDeviceMixin } from '@/mixins/device';
import { useAppStore } from '@/store/app';
import { loadingRef } from '@/shared';

export default defineComponent({
  name: 'App',
  head() {
    return {
      title: this.siteTitle as string,
    };
  },
  setup() {
    const { siteTitle: title, supportLanguages, setLocale } = useAppStore();
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();

    const siteTitle = computed(() => {
      if (typeof title === 'function') {
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
        primaryColor="#5b86e5"
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
