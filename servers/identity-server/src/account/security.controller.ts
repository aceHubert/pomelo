import { Controller, Get, Post, Req, Res, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcService } from 'nest-oidc-provider';
import { BaseController } from '@/common/controllers/base.controller';
import { isJsonRequest } from '@/common/utils/is-json-request.util';
import { AccountProviderService } from '../account-provider/account-provider.service';

@Controller('/SECURITY')
export class SecurityController extends BaseController {
  logger = new Logger(SecurityController.name, { timestamp: true });

  constructor(
    private readonly accountProviderService: AccountProviderService,
    private readonly oidcService: OidcService,
  ) {
    super();
  }

  @Get('whoami')
  @Post('whoami')
  async whoami(@Req() req: Request, @Res() res: Response) {
    const ctx = this.oidcService.getContext(req, res);
    const session = await ctx.oidc.provider.Session.get(ctx);

    let accountId: string | undefined;
    if (session?.accountId) {
      accountId = session.accountId;
    } else {
      const accessTokenValue = ctx.oidc.getAccessToken({ acceptDPoP: true });
      if (accessTokenValue) {
        const accessToken = await ctx.oidc.provider.AccessToken.find(accessTokenValue);

        if (accessToken) {
          accountId = accessToken.accountId;
        } else {
          const JWT = require('oidc-provider/lib/helpers/jwt');
          const instance = require('oidc-provider/lib/helpers/weak_cache');
          try {
            const { payload } = await JWT.verify(accessTokenValue, instance(ctx.oidc.provider).keystore);
            accountId = payload.sub;
          } catch (e) {
            this.logger.warn(e);
          }
        }
      }
    }

    if (accountId) {
      const account = await this.accountProviderService.getAccount(accountId);

      if (!account) {
        throw new HttpException('Account not found.', HttpStatus.UNAUTHORIZED);
      } else if (isJsonRequest(req.headers)) {
        return res.send(this.success({ data: account }));
      } else {
        return res.render('whoami', {
          layout: false,
          account,
        });
      }
    } else {
      throw new HttpException('Account not found.', HttpStatus.UNAUTHORIZED);
    }
  }
}
