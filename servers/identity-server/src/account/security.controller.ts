import { Controller, Get, Post, Req, Res, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { KoaContextWithOIDC } from 'oidc-provider';
import { Oidc } from 'nest-oidc-provider';
import { UserDataSource } from '@ace-pomelo/infrastructure-datasource';
import { BaseController } from '@/common/controllers/base.controller';
import { isJsonRequest } from '@/common/utils/is-json-request.util';

@Controller('/SECURITY')
export class SecurityController extends BaseController {
  logger = new Logger(SecurityController.name, { timestamp: true });

  constructor(private readonly userDataSource: UserDataSource) {
    super();
  }

  @Get('whoami')
  @Post('whoami')
  async whoami(@Oidc.Context() ctx: KoaContextWithOIDC, @Req() req: Request, @Res() res: Response) {
    const { provider } = ctx.oidc;
    const session = await provider.Session.get(ctx);

    let accountId: string | undefined;
    if (session.accountId) {
      accountId = session.accountId;
    } else {
      const accessTokenValue = ctx.oidc.getAccessToken({ acceptDPoP: true });
      if (accessTokenValue) {
        const accessToken = await provider.AccessToken.find(accessTokenValue);

        if (accessToken) {
          accountId = accessToken.accountId;
        } else {
          const JWT = require('oidc-provider/lib/helpers/jwt');
          const instance = require('oidc-provider/lib/helpers/weak_cache');
          try {
            const { payload } = await JWT.verify(accessTokenValue, instance(provider).keystore);
            accountId = payload.sub;
          } catch (e) {
            this.logger.warn(e);
          }
        }
      }
    }

    if (accountId) {
      const account = await this.userDataSource.get(Number(accountId), ['niceName', 'displayName', 'updatedAt'], {
        sub: accountId,
      });

      if (isJsonRequest(req.headers)) {
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
