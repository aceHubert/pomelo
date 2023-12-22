import * as url from 'url';
import { HttpException } from '@nestjs/common';
import { ResponseSuccess, ResponseError } from '@ace-pomelo/shared-server';

export abstract class BaseController {
  /**
   * 返回成功
   * @param data data object
   */
  protected success<T extends object = {}>(data?: T): ResponseSuccess<T> {
    // @ts-expect-error maybe "success" field in data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { success, ...restData } = data || {};
    return {
      success: true,
      ...(restData as T),
    };
  }

  /**
   * 返回失败
   * @param message 错误消息
   * @param statusCode http code
   */
  protected faild(exception: Error): ResponseError;
  protected faild(message: string, statusCode?: number): ResponseError;
  protected faild(messageOrException: string | Error, statusCode?: number): ResponseError {
    if (typeof messageOrException === 'string') {
      return {
        success: false,
        message: messageOrException,
        statusCode,
      };
    } else {
      return {
        success: false,
        message: messageOrException.message,
        statusCode: messageOrException instanceof HttpException ? messageOrException.getStatus() : undefined,
      };
    }
  }

  protected getLocaleBtns(
    req: { url: string },
    currentLang: string,
    locales: { lang: string; display: string }[] = [],
  ) {
    if (locales.length === 0) {
      locales = [
        {
          lang: 'en-US',
          display: 'EN',
        },
        {
          lang: 'zh-CN',
          display: '中',
        },
      ];
    }
    const parsedUrl = url.parse(req.url, true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lang, locale, ...restQuery } = parsedUrl.query;
    const localeRemovedUrl = url.format({
      ...parsedUrl,
      search: void 0,
      query: restQuery,
    });

    return `<div class="locale-btns">
      ${locales
        .map(
          (locale) =>
            `<a class="btn btn-sm btn-link ${currentLang === locale.lang ? 'btn-disabled' : ''}" href="${
              currentLang === locale.lang ? 'javascript:;' : getHref(locale.lang)
            }" >${locale.display}</a>`,
        )
        .join('<div class="divider"></div>')}
    </div>`;

    function getHref(lang: string) {
      return `${localeRemovedUrl}${localeRemovedUrl.indexOf('?') >= 0 ? '&' : '?'}locale=${lang}`;
    }
  }
}
