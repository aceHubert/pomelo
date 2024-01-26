import Vue from 'vue';
import VueI18n, { type IVueI18n } from 'vue-i18n';
import { defaultSettings } from '@/configs/settings.config';
import zhCN from './langs/zh-CN_basic.json';
import enUS from './langs/en-US.json';

Vue.use(VueI18n);

/**
 * 扩展方法
 * tv(key, default, locale, values) 如果 key 的翻译没有则为 fallbackStr, 如果 fallbackStr 没有，则为 key
 */
Object.defineProperties(VueI18n.prototype, {
  tv: {
    value: function (this: VueI18n, key: VueI18n.Path, fallbackStr: string, ...values: any) {
      const locale = typeof values[0] == 'string' ? values[0] : undefined;
      return (this.te(key, locale) ? this.t(key, ...values) : fallbackStr) || key;
    },
    writable: false,
    enumerable: true,
    configurable: true,
  },
  tcv: {
    value(key, fallbackStr, ...values) {
      const locale = typeof values[0] === 'string' ? values[0] : undefined;
      return (this.te(key, locale) ? this.tc(key, ...values) : fallbackStr) || key;
    },
    writable: false,
    enumerable: true,
    configurable: true,
  },
});

export const i18n = new VueI18n({
  locale: defaultSettings.language.defaultLocale,
  fallbackLocale: defaultSettings.language.fallbackLocale,
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
  },
  silentFallbackWarn: process.env.NODE_ENV === 'production',
}) as VueI18n & IVueI18n;

export const supportLanguages = defaultSettings.language.supportLanguages.filter((item) =>
  Object.hasOwnProperty.call(i18n.messages, item.locale),
);

/**
 * 扩展VueI18n.tv方法添加到 Vue 实例中
 */
Object.defineProperties(Vue.prototype, {
  $tv: {
    value: function (this: Vue, key: VueI18n.Path, fallbackStr: string, ...values: any): VueI18n.TranslateResult {
      const i18n = this.$i18n;
      return i18n.tv(key, fallbackStr, ...values);
    },
    writable: false,
    enumerable: true,
    configurable: true,
  },
  $tcv: {
    value(key, fallbackStr, ...values) {
      // const i18n = this.$i18n; // fix: this 指向不明
      return i18n.tcv(key, fallbackStr, ...values);
    },
    writable: false,
    enumerable: true,
    configurable: true,
  },
});

declare module 'vue/types/vue' {
  interface Vue {
    $tv: IVueI18n['tv'];
    $tcv: IVueI18n['tcv'];
  }
}

declare module 'vue-i18n' {
  interface IVueI18n {
    tv(key: Path, fallbackStr: string, values?: Values): TranslateResult;
    tv(key: Path, fallbackStr: string, locale?: Locale, values?: Values): TranslateResult;
    tcv(key: VueI18n.Path, fallbackStr: string, choice?: VueI18n.Choice, values?: VueI18n.Values): string;
    tcv(
      key: VueI18n.Path,
      fallbackStr: string,
      choice: VueI18n.Choice,
      locale: VueI18n.Locale,
      values?: VueI18n.Values,
    ): string;
  }
}
