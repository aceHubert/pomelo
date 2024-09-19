import { Logger, HttpException } from '@nestjs/common';
import { ResponseSuccess, ResponseError } from '@ace-pomelo/shared/server';

export abstract class BaseController {
  protected logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

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
}
