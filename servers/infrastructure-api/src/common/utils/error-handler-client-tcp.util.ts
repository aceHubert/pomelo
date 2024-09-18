import { HttpException } from '@nestjs/common';
import { ClientTCP } from '@nestjs/microservices';

/**
 * Transform plain error to HttpException
 */
export class ErrorHandlerClientTCP extends ClientTCP {
  protected serializeError(err: any) {
    return new HttpException(err, 500);
  }
}
