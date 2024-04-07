import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OidcService } from '../oidc.service';
import { AUTHORIZATION_KEY, ALLOWANONYMOUS_KEY } from '../oidc.constants';
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

    const anonymous = hasDecorator(ALLOWANONYMOUS_KEY, context, this.reflector);

    // @Anonymous() decorator, return true
    if (anonymous) return true;

    const authorized = hasDecorator(AUTHORIZATION_KEY, context, this.reflector);

    // no @Authorized() decorator, return true
    if (!authorized) return true;

    if (ctx.isAuthenticated()) {
      if (ctx.user.expired) {
        if (ctx.user.refresh_token) {
          const params = ctx.params;
          await this.oidcService
            .requestTokenRefresh(ctx.user.refresh_token, {
              tenantId: params.tenantId,
              channelType: params.channelType as any,
            })
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
