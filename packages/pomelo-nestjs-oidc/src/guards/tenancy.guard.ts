import { CanActivate, ExecutionContext, HttpException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MisdirectedStatus, OidcModuleOptions } from '../interfaces';
import { hasDecorator } from '../utils/has-decorator';
import { getContextObject } from '../utils/get-context-object';
import { OIDC_MODULE_OPTIONS } from '../oidc.constants';

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(@Inject(OIDC_MODULE_OPTIONS) private options: OidcModuleOptions, private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = getContextObject<Request>(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const isMultitenantDecorator = hasDecorator('isMultitenant', context, this.reflector);
    const isMultitenant = !!this.options.issuerOrigin;
    if (typeof isMultitenantDecorator !== 'undefined' && isMultitenantDecorator !== isMultitenant) {
      throw new NotFoundException();
    } else if (
      ((typeof isMultitenantDecorator === 'undefined' || isMultitenantDecorator === isMultitenant) && !ctx.user) ||
      !ctx.user?.profile?.channel_type ||
      !ctx.params.tenantId ||
      ctx.params.tenantId === 'favicon.ico' ||
      (!this.options.channelType && !ctx.params.channelType) ||
      (ctx.user?.profile?.channel_type &&
        ctx.user?.profile?.tenant_id &&
        ctx.user?.profile?.tenant_id === ctx.params.tenantId &&
        (!this.options.channelType ? ctx.user?.profile?.channel_type === ctx.params.channelType : true))
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
