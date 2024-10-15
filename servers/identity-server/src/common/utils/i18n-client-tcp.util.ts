import { HttpException, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { ClientTCP, Serializer, ReadPacket } from '@nestjs/microservices';

/**
 * Transform plain error to HttpException
 */
export class ErrorHandlerClientTCP extends ClientTCP {
  logger2 = new Logger(ErrorHandlerClientTCP.name, { timestamp: true });

  protected serializeError(err: any) {
    this.logger2.debug('serializeError', err);
    return new HttpException(err, 500);
  }
}

export class I18nSerializer implements Serializer {
  serialize(value: ReadPacket) {
    const i18n = I18nContext.current();
    return { ...value, lang: i18n?.lang };
  }
}
