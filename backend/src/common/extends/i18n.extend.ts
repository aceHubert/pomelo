import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';

// Types
import { TranslateOptions } from 'nestjs-i18n';

declare module 'nestjs-i18n/dist/services/i18n.service' {
  interface I18nService {
    tv(key: string, fallback: string, options?: TranslateOptions): Promise<any>;
  }
}

declare module 'nestjs-i18n/dist/i18n.context' {
  interface I18nContext {
    tv(key: string, fallback: string, options?: TranslateOptions): Promise<any>;
  }
}

Object.defineProperties(I18nService.prototype, {
  tv: {
    value: async function (key: string, fallback: string, options?: TranslateOptions): Promise<any> {
      const translate = await this.translate(key, options);
      return translate === key ? fallback : translate;
    },
    writable: false,
    configurable: false,
  },
});

Object.defineProperties(I18nContext.prototype, {
  tv: {
    value: async function (key: string, fallback: string, options?: TranslateOptions): Promise<any> {
      const translate = await this.translate(key, options);
      return translate === key ? fallback : translate;
    },
    writable: false,
    configurable: false,
  },
});
