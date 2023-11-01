import { snakeCase } from 'lodash';
import statuses from 'statuses';
import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { BaseError as SequelizeBaseError, DatabaseError as SequelizeDatabaseError } from 'sequelize';
import { GraphQLError } from 'graphql';
import { isHttpError } from 'http-errors';
import { I18nContext, I18nTranslation } from 'nestjs-i18n';
import { Request, Response } from 'express';
import { InvalidPackageNameError, InvalidPackageVersionError } from 'query-registry';

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
      const description = await this.getHttpDescriptionFromError(exception);

      // @ts-expect-error code doesn't export type
      if (exception instanceof SequelizeDatabaseError && exception.original.code === 'ER_NO_SUCH_TABLE') {
        // 当出现表不存在错误时，提示要初始化数据库， 并设置 response.dbInitRequired = true
        description.message = (await i18n?.tv('error.no_such_table', 'No such table!')) ?? 'No such table!';
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
      return response.status(status).json(responseData);
    } else if (type === 'graphql') {
      // 将非 ApolloError 转换在 ApolloError
      if (!(exception instanceof GraphQLError)) {
        const extensions: Record<string, any> = {
          code: this.getGraphqlCodeFromError(exception),
        };
        // @ts-expect-error code doesn't export type
        if (exception instanceof SequelizeDatabaseError && exception.original.code === 'ER_NO_SUCH_TABLE') {
          // 当出现表不存在错误时，提示要初始化数据库, 并设置 extensions.dbInitRequired = true
          extensions['dbInitRequired'] = true;
        }
        return new GraphQLError(exception.message, {
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

  /**
   * 从 Error 获取返回的 http code
   * @param exception Error
   */
  private getHttpCodeFromError(exception: Error | { status?: number }): number {
    return exception instanceof HttpException // 如果是 Http 错误，直接获取 status code
      ? exception.getStatus()
      : isHttpError(exception)
      ? exception.statusCode // 如果是 http-errors 错误，直接获取 statusCode
      : exception instanceof InvalidPackageNameError || exception instanceof InvalidPackageVersionError //  query-registry InvalidPackageNameError/InvalidPackageVersionError 转换成 http 405
      ? HttpStatus.METHOD_NOT_ALLOWED
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
      : exception instanceof InvalidPackageNameError || exception instanceof InvalidPackageVersionError //  query-registry InvalidPackageNameError/InvalidPackageVersionError 转换成 METHOD_NOT_ALLOWED
      ? getFromHttpStatus(HttpStatus.METHOD_NOT_ALLOWED)
      : getFromHttpStatus((exception as { status?: number }).status ?? HttpStatus.INTERNAL_SERVER_ERROR);

    function getFromHttpStatus(status: number) {
      return snakeCase(statuses(status)).toUpperCase();
    }
  }

  /**
   * 获取 http 的 response 对象
   * @param exception Error
   */
  private async getHttpDescriptionFromError(exception: Error): Promise<Dictionary<any>> {
    const description =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof SequelizeBaseError
        ? ((exception as any).original || exception).message // 部分 sequelize error 格式化 error 到original
        : exception.message;

    return typeof description === 'string' ? { message: description } : description;
  }
}
