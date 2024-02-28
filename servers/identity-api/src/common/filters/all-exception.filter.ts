import { snakeCase } from 'lodash';
import statuses from 'statuses';
import iterate from 'iterare';
import { Request, Response } from 'express';
import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { I18nContext, I18nValidationException, I18nValidationError } from 'nestjs-i18n';
import { mapChildrenToValidationErrors, formatI18nErrors } from 'nestjs-i18n/dist/utils';
import { BaseError as SequelizeBaseError } from 'sequelize';
import { GraphQLError } from 'graphql';
import { isHttpError } from 'http-errors';
import { renderMsgPage } from '@ace-pomelo/nestjs-oidc';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name, { timestamp: true });

  constructor() {}

  async catch(exception: Error, host: ArgumentsHost) {
    // log
    this.logger.error(exception, exception.stack);

    const i18n = I18nContext.current();
    switch (host.getType<GqlContextType>()) {
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

        if (this.isJson(request)) {
          return response.status(status).json(responseData);
        } else {
          let errorPage: string;
          switch (status) {
            case HttpStatus.NOT_FOUND:
              errorPage = renderMsgPage({
                title: `Page not found!`,
                icon: '404',
                actionsAlign: 'center',
                backLabel: 'Back',
              });
              break;
            default:
              errorPage = renderMsgPage({
                title: `We are sorry, it has encountered an error.`,
                subtitle: `Error ${status}`,
                description: responseData.message ?? exception.message,
                icon: 'warning',
              });
              break;
          }
          return response.send(errorPage);
        }
      case 'graphql':
        // 将非 ApolloError 转换在 ApolloError
        if (!(exception instanceof GraphQLError)) {
          const { message, ...restDescription } = this.getDescriptionFromError(exception, i18n);
          const extensions: Record<string, any> = {
            ...restDescription,
            code: this.getGraphqlCodeFromError(exception),
          };

          return new GraphQLError(Array.isArray(message) ? message.join(', ') : message, {
            originalError: exception,
            extensions,
          });
        }

        return exception;
      default:
        // todo:其它情况
        return exception;
    }
  }

  private isJson(req: Request) {
    const requestAccept = req.headers['accept'];
    let contentType = 'text/html';

    if (requestAccept && (requestAccept.includes('json') || requestAccept.includes('text/javascript'))) {
      contentType = 'application/json';
    }

    return contentType === 'application/json';
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
   * 从 Error 获取 graphql 的 extensions.code
   * @param exception Error
   */
  private getGraphqlCodeFromError(exception: Error | { status?: number }) {
    return exception instanceof HttpException
      ? getFromHttpStatus(exception.getStatus())
      : isHttpError(exception)
      ? getFromHttpStatus(exception.statusCode)
      : getFromHttpStatus((exception as { status?: number }).status ?? HttpStatus.INTERNAL_SERVER_ERROR);

    function getFromHttpStatus(status: number) {
      return snakeCase(statuses(status)).toUpperCase();
    }
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
            message: this.flattenValidationErrors(
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
        : exception.message;

    return typeof description === 'string'
      ? { message: description }
      : {
          message: exception.message,
          ...description,
        };
  }

  private flattenValidationErrors(validationErrors: I18nValidationError[]): string[] {
    return iterate(validationErrors)
      .map((error) => mapChildrenToValidationErrors(error))
      .flatten()
      .filter((item) => !!item.constraints)
      .map((item) => Object.values(item.constraints!))
      .flatten()
      .toArray();
  }
}
