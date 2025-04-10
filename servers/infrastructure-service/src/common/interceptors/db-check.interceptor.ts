import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';
import { FileEnv } from '@ace-pomelo/shared/server';
import { name } from '@/datasource';
import { getDbLockFileEnv } from '../utils/lock-file.util';

let NeedInitDatasCache: boolean;
const IgnoreDbCheckInterceptorName = Symbol('IgnoreDbCheckInterceptor');

/**
 * Ignore db check interceptor
 */
export function IgnoreDbCheckInterceptor(): ClassDecorator & MethodDecorator {
  return SetMetadata(IgnoreDbCheckInterceptorName, true);
}

@Injectable()
export class DbCheckInterceptor implements NestInterceptor {
  private fileEnv: FileEnv;

  constructor(private readonly reflector: Reflector, readonly configService: ConfigService) {
    this.fileEnv = getDbLockFileEnv(configService);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ignored = this.reflector.getAllAndOverride<boolean>(IgnoreDbCheckInterceptorName, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ignored || !NeedInitDatasCache) {
      const i18n = I18nContext.current(context);
      const needInitDatas = (NeedInitDatasCache = this.fileEnv.getEnv(name) === 'PENDING');
      if (needInitDatas) {
        throw new RpcException({
          // 提示要初始化数据库， 并设置 response.siteInitRequired = true
          message:
            i18n?.tv('site-init.required', 'Site datas initialization is required!') ??
            'Site datas initialization is required!',
          siteInitRequired: true,
        });
      }
    }
    return next.handle();
  }
}
