import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { isObject } from '@nestjs/common/utils/shared.utils';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { BaseError as SequelizeBaseError } from 'sequelize';
import { isHttpError } from 'http-errors';
import { Request, Response } from 'express';
import { isJsonRequest } from '../utils/is-json-request.util';
import { formatI18nErrors, flattenValidationErrors } from '../utils/i18n-error.util';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name, { timestamp: true });

  async catch(exception: Error, host: ArgumentsHost) {
    // log
    const loggerArgs: [string, string?] = this.isError(exception) ? [exception.message, exception.stack] : [exception];
    this.logger.error(...loggerArgs);

    const i18n = I18nContext.current(host);
    switch (host.getType()) {
      case 'http':
        const http = host.switchToHttp();

        const request = http.getRequest<Request>();
        const response = http.getResponse<Response>();
        const status = this.getHttpCodeFromError(exception);
        const description = this.getDescriptionFromError(exception, i18n);

        const responseData = Object.assign({}, description, {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        if (responseData.message && Array.isArray(responseData.message)) {
          responseData.message = responseData.message.join('; ');
        }

        if (isJsonRequest(request.headers)) {
          return response.status(status).json(responseData);
        } else {
          let viewName = 'error',
            layout: string | false = false;
          switch (status) {
            case HttpStatus.NOT_FOUND:
              viewName = '404';
              layout = false;
              break;
            default:
              break;
          }

          return response.render(
            viewName,
            {
              ...responseData,
              layout,
            },
            (err, html) => {
              if (err) {
                this.logger.error(err);
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal Server Error');
              }
              return response.send(html);
            },
          );
        }
      default:
        // todo:其它情况
        return exception;
    }
  }

  isError(exception: any): exception is Error {
    return !!(isObject(exception) && (exception as any).message);
  }

  /**
   * 从 Error 获取返回的 http code
   * @param exception Error
   */
  private getHttpCodeFromError(exception: Error | { status?: number }): number {
    return exception instanceof HttpException // 如果是 Http 错误，直接获取 status code
      ? exception.getStatus()
      : isHttpError(exception)
      ? exception.statusCode // 如果是 http-errors 错误，直接获取 statusCode
      : (exception as { status?: number }).status ?? HttpStatus.INTERNAL_SERVER_ERROR; // 否则返回 500
  }

  /**
   * 获取实际的错误描述
   * @param exception Error
   */
  private getDescriptionFromError(
    exception: Error,
    i18n?: I18nContext,
  ): { message: string | string[]; [key: string]: any } {
    const description =
      exception instanceof I18nValidationException
        ? {
            message: flattenValidationErrors(
              i18n
                ? formatI18nErrors(exception.errors, i18n.service, {
                    lang: i18n.lang,
                  })
                : exception.errors,
            ),
          }
        : exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof SequelizeBaseError
        ? ((exception as any).original || exception).message // 部分 sequelize error 格式化 error 到original
        : (exception as any).error_description || // oidc-provider error
          exception.message;

    return typeof description === 'string'
      ? { message: description }
      : {
          message: exception.message,
          ...description,
        };
  }
}
