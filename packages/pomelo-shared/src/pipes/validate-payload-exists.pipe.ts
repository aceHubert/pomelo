import { Injectable, PipeTransform, HttpStatus } from '@nestjs/common';
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

export interface ValidatePayloadExistsPipeOptions<T extends object> {
  /**
   * oneOf: at least one of the keys should be in the payload
   */
  oneOf?: (keyof T)[];
  /**
   * allOf: all of the keys should be in the payload
   */
  allOf?: (keyof T)[];
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
}

Injectable();
export class ValidatePayloadExistsPipe<T extends object> implements PipeTransform<T> {
  protected oneOf?: (keyof T)[];
  protected allOf?: (keyof T)[];
  protected exceptionFactory: (error: string) => any;
  constructor(options?: ValidatePayloadExistsPipeOptions<T>) {
    const { oneOf, allOf, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options ?? {};
    this.oneOf = oneOf;
    this.allOf = allOf;
    this.exceptionFactory =
      options?.exceptionFactory ?? ((error: string) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(payload: T) {
    const payloadKeys = Object.keys(payload);
    if (this.allOf?.length && !this.allOf.every((key) => payloadKeys.includes(String(key)))) {
      throw this.exceptionFactory(`Payload should have all fields of keys "${this.allOf.join(', ')}"!`);
    } else if (this.oneOf?.length && !this.oneOf.some((key) => payloadKeys.includes(String(key)))) {
      throw this.exceptionFactory(`Payload should have at latest one field from key of "${this.oneOf!.join(', ')}"!`);
    } else if (!payloadKeys.length) {
      throw this.exceptionFactory('Payload should not be empty!');
    }

    return payload;
  }
}
