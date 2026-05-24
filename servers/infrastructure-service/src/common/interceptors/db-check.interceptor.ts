import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';
import { UserDataSource } from '../../datasource';

let SiteInitializedCache: boolean | undefined;
const IgnoreDbCheckInterceptorName = Symbol('IgnoreDbCheckInterceptor');
const DefaultAdminName = 'admin';

/**
 * Ignore db check interceptor
 */
export function IgnoreDbCheckInterceptor(): ClassDecorator & MethodDecorator {
  return SetMetadata(IgnoreDbCheckInterceptorName, true);
}

@Injectable()
export class DbCheckInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly userDataSource: UserDataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ignored = this.reflector.getAllAndOverride<boolean>(IgnoreDbCheckInterceptorName, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ignored && !(await this.isSiteInitialized())) {
      const i18n = I18nContext.current(context);
      throw new RpcException({
        // 提示要初始化数据，并设置 response.siteInitRequired = true
        message:
          i18n?.tv('site-init.required', 'Site datas initialization is required!') ??
          'Site datas initialization is required!',
        siteInitRequired: true,
      });
    }
    return next.handle();
  }

  private async isSiteInitialized() {
    if (SiteInitializedCache === true) {
      return true;
    }
    SiteInitializedCache = await this.userDataSource.isLoginNameExists(DefaultAdminName);
    return SiteInitializedCache;
  }
}
