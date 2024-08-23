import { CanActivate, ExecutionContext, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MisdirectedStatus } from '../interfaces';
import { OidcService } from '../oidc.service';
import { hasDecorator } from '../utils/has-decorator';
import { getContextObject } from '../utils/get-context-object';

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(private reflector: Reflector, private oidcService: OidcService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = getContextObject<Request>(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const isMultitenant = hasDecorator('isMultitenant', context, this.reflector);
    if (typeof isMultitenant !== 'undefined' && isMultitenant !== this.oidcService.isMultitenant) {
      throw new NotFoundException();
    } else if (
      ((typeof isMultitenant === 'undefined' || isMultitenant === this.oidcService.isMultitenant) && !ctx.user) ||
      !ctx.user?.profile?.channel_type ||
      !ctx.params.tenantId ||
      ctx.params.tenantId === 'favicon.ico' ||
      (!this.oidcService.channelType && !ctx.params.channelType) ||
      (ctx.user?.profile?.channel_type &&
        ctx.user?.profile?.tenant_id &&
        ctx.user?.profile?.tenant_id === ctx.params.tenantId &&
        (!this.oidcService.channelType ? ctx.user?.profile?.channel_type === ctx.params.channelType : true))
    ) {
      return true;
    } else {
      throw new HttpException(
        {
          tenantId: ctx.params.tenantId,
          channelType: ctx.params.channelType,
        },
        MisdirectedStatus.MISDIRECTED,
      );
    }
  }
}
