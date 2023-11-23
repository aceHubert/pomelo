import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseError as SequelizeBaseError } from 'sequelize';
import { isHttpError } from 'http-errors';
import { Request, Response } from 'express';
import { InvalidPackageNameError, InvalidPackageVersionError } from 'query-registry';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name, { timestamp: true });

  async catch(exception: Error, host: ArgumentsHost) {
    // log
    this.logger.error(exception, exception.stack);

    const type = host.getType();
    if (type === 'http') {
      const http = host.switchToHttp();

      const request = http.getRequest<Request>();
      const response = http.getResponse<Response>();
      const status = this.getHttpCodeFromError(exception);
      const description = await this.getHttpDescriptionFromError(exception);

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
      : exception instanceof InvalidPackageNameError || exception instanceof InvalidPackageVersionError //  query-registry InvalidPackageNameError/InvalidPackageVersionError 转换成 http 405
      ? HttpStatus.METHOD_NOT_ALLOWED
      : (exception as { status?: number }).status ?? HttpStatus.INTERNAL_SERVER_ERROR; // 否则返回 500
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
