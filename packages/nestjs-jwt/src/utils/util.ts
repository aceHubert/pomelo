import type { MiddlewareConsumer } from '@nestjs/common';
import type { AbstractHttpAdapter } from '@nestjs/core';

export interface NestMiddlewareConsumer extends MiddlewareConsumer {
  httpAdapter: AbstractHttpAdapter;
}

export const isNestMiddleware = (consumer: MiddlewareConsumer): consumer is NestMiddlewareConsumer => {
  return typeof (consumer as any).httpAdapter === 'object';
};

export const usingFastify = (consumer: NestMiddlewareConsumer) => {
  return consumer.httpAdapter.constructor.name.toLowerCase().startsWith('fastify');
};
