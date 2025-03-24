import { HttpException } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';

/**
 * Transform plain error to HttpException
 */
export class ErrorHandlerClientGrpcProxy extends ClientGrpcProxy {
  protected serializeError(err: any) {
    this.logger.debug(`serializeError: ${String(err)}`);
    return new HttpException(err, 500);
  }
}
