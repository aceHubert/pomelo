import { TranslateOptions, Path, PathValue } from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';
import { I18nContext } from 'nestjs-i18n/dist/i18n.context';
import { IfAnyOrNever } from 'nestjs-i18n/dist/types';

declare module 'nestjs-i18n/dist/services/i18n.service' {
  interface I18nService<K = Record<string, unknown>> {
    tv<P extends Path<K> = any, R = PathValue<K, P>>(
      key: P,
      fallback: TranslateOptions['defaultValue'],
      options?: Omit<TranslateOptions, 'defaultValue'>,
    ): IfAnyOrNever<R, string, R>;
  }
}

declare module 'nestjs-i18n/dist/i18n.context' {
  interface I18nContext<K = Record<string, unknown>> {
    tv<P extends Path<K> = any, R = PathValue<K, P>>(
      key: P,
      fallback: TranslateOptions['defaultValue'],
      options?: Omit<TranslateOptions, 'defaultValue'>,
    ): IfAnyOrNever<R, string, R>;
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
