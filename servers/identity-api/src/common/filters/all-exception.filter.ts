import { snakeCase } from 'lodash';
import statuses from 'statuses';
import { Request, Response } from 'express';
import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { BaseError as SequelizeBaseError, DatabaseError as SequelizeDatabaseError } from 'sequelize';
import { GraphQLError } from 'graphql';
import { isHttpError } from 'http-errors';
import { I18nContext, I18nTranslation } from 'nestjs-i18n';
import { renderMsgPage } from '@ace-pomelo/nestjs-oidc';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name, { timestamp: true });

  async catch(exception: Error, host: ArgumentsHost) {
    // log
    this.logger.error(exception, exception.stack);

    const type = host.getType<GqlContextType>();
    const i18n = I18nContext.current<I18nTranslation>(host);
    if (type === 'http') {
      const http = host.switchToHttp();

      const request = http.getRequest<Request>();
      const response = http.getResponse<Response>();
      const status = this.getHttpCodeFromError(exception);
      const description = this.getDescriptionFromError(exception);

      // @ts-expect-error code doesn't export type
      if (exception instanceof SequelizeDatabaseError && exception.original.code === 'ER_NO_SUCH_TABLE') {
        // 当出现表不存在错误时，提示要初始化数据库， 并设置 response.dbInitRequired = true
        description.message = i18n?.tv('error.no_such_table', 'No such table!') ?? 'No such table!';
        description.dbInitRequired = true;
      }

      const responseData = Object.assign({}, description, {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      if (responseData.message && Array.isArray(responseData.message)) {
        responseData.message = responseData.message.join('; ');
      }

      this.logger.error(exception);

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
    } else if (type === 'graphql') {
      // 将非 ApolloError 转换在 ApolloError
      if (!(exception instanceof GraphQLError)) {
        const extensions: Record<string, any> = {
          code: this.getGraphqlCodeFromError(exception),
        };

        const { message } = this.getDescriptionFromError(exception);

        return new GraphQLError(Array.isArray(message) ? message.join(', ') : message, {
          originalError: exception,
          extensions,
        });
      }
      return exception;
    } else {
      // todo:其它情况
      return;
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
  private getDescriptionFromError(exception: Error): { message: string | string[]; [key: string]: any } {
    const description =
      exception instanceof HttpException
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
}
