import { Controller, Get, Post } from '@nestjs/common';
import { KoaContextWithOIDC } from 'oidc-provider';
import { Oidc } from 'nest-oidc-provider';
import { BaseController } from '@ace-pomelo/shared-server';
import { UserDataSource } from '@ace-pomelo/datasource';

@Controller('/SECURITY')
export class SecurityController extends BaseController {
  constructor(private readonly userDataSource: UserDataSource) {
    super();
  }
  @Get('whoami')
  @Post('whoami')
  async whoami(@Oidc.Context() ctx: KoaContextWithOIDC) {
    const { provider } = ctx.oidc;
    const session = await provider.Session.get(ctx);

    let accountId: string | undefined;
    if (session.accountId) {
      accountId = session.accountId;
    } else {
      const accessTokenValue = ctx.oidc.getAccessToken({ acceptDPoP: true });
      const accessToken = await provider.AccessToken.find(accessTokenValue);
      if (accessToken) {
        accountId = accessToken.accountId;
      } else {
      }
    }

    if (accountId) {
      const account = await this.userDataSource.get(Number(accountId), ['niceName', 'displayName', 'updatedAt'], {
        sub: accountId,
      });
      return this.success({
        account,
      });
    } else {
      return this.faild('Not found account.');
    }
  }
}
