import { KoaContextWithOIDC } from 'oidc-provider';
import { Logger, ContextType } from '@nestjs/common';
import { ArgumentsHost, HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';
import { I18nContext } from 'nestjs-i18n';

export class KoaContextI18nError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KoaContextI18nError';
  }
}

const ExecutionContextMethodNotImplemented = new KoaContextI18nError(
  "Method not implemented. nestjs-i18n creates a fake Http context since it's using middleware to resolve your language. Nestjs middlewares don't have access to the ExecutionContext.",
);

export const logger = new Logger('KoaContextI18nHelper');

class KoaHttpContext implements ArgumentsHost, HttpArgumentsHost {
  constructor(private ctx: KoaContextWithOIDC) {}

  getArgs<T extends any[] = any[]>(): T {
    throw ExecutionContextMethodNotImplemented;
  }

  getArgByIndex<T = any>(): T {
    throw ExecutionContextMethodNotImplemented;
  }

  switchToRpc(): RpcArgumentsHost {
    throw ExecutionContextMethodNotImplemented;
  }

  switchToHttp(): HttpArgumentsHost {
    return this;
  }

  switchToWs(): WsArgumentsHost {
    throw ExecutionContextMethodNotImplemented;
  }

  getType<TContext extends string = ContextType>(): TContext {
    return 'http' as any;
  }

  getRequest<T = any>(): T {
    return this.ctx.request as T;
  }

  getResponse<T = any>(): T {
    return this.ctx.response as T;
  }

  getNext<T = any>(): T {
    throw ExecutionContextMethodNotImplemented;
  }
}

export const getI18nFromContext = (context: KoaContextWithOIDC) => {
  const i18n = I18nContext.current(new KoaHttpContext(context));

  if (i18n == undefined) {
    if (!i18n) {
      logger.error(
        'I18n context not found! Is this function triggered by a processor or cronjob? Please use the I18nService',
      );
    }
    throw new Error('I18n context undefined');
  }

  return i18n;
};
