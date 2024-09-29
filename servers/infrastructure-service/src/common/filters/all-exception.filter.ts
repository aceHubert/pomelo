import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { flattenValidationErrors, formatI18nErrors } from '../utils/i18n-error.util';

@Catch()
export class AllExceptionFilter extends BaseRpcExceptionFilter {
  private logger = new Logger(AllExceptionFilter.name, { timestamp: true });

  catch(exception: any, host: ArgumentsHost) {
    // log
    const loggerArgs: [string, string?] = super.isError(exception) ? [exception.message, exception.stack] : [exception];
    this.logger.error(...loggerArgs);

    const i18n = I18nContext.current(host);

    if (!(exception instanceof RpcException)) {
      const description = this.getDescriptionFromError(exception, i18n);
      return super.catch(new RpcException({ status: 'error', ...description }), host);
    }
    const error = exception.getError();
    return super.catch(
      new RpcException(typeof error === 'string' ? { status: 'error', message: error } : { status: 'error', ...error }),
      host,
    );
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
        : exception.message;

    return typeof description === 'string'
      ? { message: description }
      : {
          message: exception.message,
          ...description,
        };
  }
}
