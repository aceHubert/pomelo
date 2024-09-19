import { TranslateOptions } from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

declare module 'nestjs-i18n/dist/services/i18n.service' {
  interface I18nService {
    tv<T = any>(key: string, fallback: T, options?: Omit<TranslateOptions, 'defaultValue'>): T;
  }
}

declare module 'nestjs-i18n/dist/i18n.context' {
  interface I18nContext {
    tv<T = any>(key: string, fallback: T, options?: Omit<TranslateOptions, 'defaultValue'>): T;
  }
}

Object.defineProperties(I18nService.prototype, {
  tv: {
    value: function (
      this: I18nService,
      key: string,
      fallback: string,
      options?: Omit<TranslateOptions, 'defaultValue'>,
    ) {
      return this.translate(key, {
        ...options,
        defaultValue: fallback,
      });
    },
    writable: false,
    configurable: false,
  },
});

Object.defineProperties(I18nContext.prototype, {
  tv: {
    value: function (
      this: I18nContext,
      key: string,
      fallback: string,
      options?: Omit<TranslateOptions, 'defaultValue'>,
    ) {
      return this.translate(key, {
        ...options,
        defaultValue: fallback,
      });
    },
    writable: false,
    configurable: false,
  },
});
