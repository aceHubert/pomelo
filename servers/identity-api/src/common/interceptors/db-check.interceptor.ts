import path from 'path';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import {
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { I18nContext, I18nTranslation } from 'nestjs-i18n';
import { name } from '@ace-pomelo/identity-datasource';
import { FileEnv } from '@ace-pomelo/shared-server';

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
  constructor(private readonly reflector: Reflector) {
    this.fileEnv = FileEnv.getInstance(path.join(process.cwd(), '..', 'db.lock'));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ignored = this.reflector.getAllAndOverride<boolean>(IgnoreDbCheckInterceptorName, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ignored) {
      const i18n = I18nContext.current<I18nTranslation>(context);
      const needInitDatas = this.fileEnv.getEnv(name) === 'PENDING';
      if (needInitDatas) {
        throw new HttpException(
          {
            // 提示要初始化数据库， 并设置 response.siteInitRequired = true
            message:
              i18n?.tv('site-init.required', 'Site datas initialization is required!') ??
              'Site datas initialization is required!',
            siteInitRequired: true,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return next.handle();
  }
}
