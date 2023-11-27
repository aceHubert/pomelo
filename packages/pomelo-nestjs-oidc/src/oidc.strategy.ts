import { Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, TokenSet } from 'openid-client';
import { ChannelType, User } from './interfaces';
import { OidcService } from './oidc.service';

export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  readonly logger = new Logger(OidcStrategy.name);

  userInfoCallback: any;

  constructor(
    private oidcService: OidcService,
    private idpKey: string,
    private tanantId?: string,
    private channelType?: ChannelType,
  ) {
    super({
      client: oidcService.idpInfos[idpKey].client,
      params: oidcService.options.authParams,
      usePKCE: oidcService.options.usePKCE,
      passReqToCallback: false,
    });
  }

  async validate(tokenset: TokenSet): Promise<User> {
    const id_token = tokenset.id_token;
    if (!id_token) {
      throw new UnauthorizedException('id_token is invalid!');
    }

    if (tokenset.expired()) {
      throw new UnauthorizedException('token is expired!');
    }

    await this.oidcService.processClaims(tokenset, this.idpKey);

    tokenset.profile['tenant_id'] = this.tanantId;
    tokenset.profile['channel_type'] = this.channelType;

    const user = this.oidcService.buildUser(tokenset);

    return user;
  }
}
