import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OidcService } from '../oidc.service';
import { hasDecorator } from '../utils/has-decorator';
import { getContextObject } from '../utils/get-context-object';

@Injectable()
export class GuestTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private oidcService: OidcService) {}

  async canActivate(context: ExecutionContext) {
    const ctx = getContextObject<Request>(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const isPublic = hasDecorator('isPublic', context, this.reflector);

    if (isPublic) return true;

    if (ctx.isAuthenticated()) {
      if (ctx.user.expired) {
        if (ctx.user.refresh_token) {
          const params = ctx.params;
          const idpKey = this.oidcService.getIdpInfosKey(params.tenantId, params.channelType as any);
          await this.oidcService
            .requestTokenRefresh(ctx.user.refresh_token, idpKey)
            .then((data) => {
              this.oidcService.updateUserToken(data, ctx);
              data.refresh_expires_in && this.oidcService.updateSessionDuration(data.refresh_expires_in as number, ctx);
            })
            .catch((err) => {
              throw new UnauthorizedException(err);
            });
        } else {
          throw new UnauthorizedException();
        }
      }
      return true;
    } else {
      return true;
    }
  }
}
