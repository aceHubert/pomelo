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
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nTranslation } from 'nestjs-i18n';
import { DbCheck } from '../utils/db-check.util';

const IgnoreDbCheckInterceptorName = Symbol('IgnoreDbCheckInterceptor');

/**
 * Ignore db check interceptor
 */
export function IgnoreDbCheckInterceptor(): ClassDecorator & MethodDecorator {
  return SetMetadata(IgnoreDbCheckInterceptorName, true);
}

@Injectable()
export class DbCheckInterceptor implements NestInterceptor {
  private dbCheck: DbCheck;

  constructor(private readonly reflector: Reflector, configService: ConfigService) {
    this.dbCheck = new DbCheck(path.join(configService.getOrThrow('contentPath'), 'db.lock'));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ignored = this.reflector.getAllAndOverride<boolean>(IgnoreDbCheckInterceptorName, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ignored) {
      const i18n = I18nContext.current<I18nTranslation>(context);
      const initialed = this.dbCheck.hasDatasInitialized();
      if (!initialed) {
        throw new HttpException(
          {
            // 提示要初始化数据库， 并设置 response.siteInitRequired = true
            message:
              i18n?.tv('error.site_datas_init_required', 'Site datas initialization is required!') ??
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
