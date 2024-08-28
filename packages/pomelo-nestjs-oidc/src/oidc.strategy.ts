import { Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, TokenSet, IdTokenClaims } from 'openid-client';
import { ClaimsService } from './helpers/claims.service';
import { UserInfoService } from './helpers/userinfo.service';
import { ChannelType } from './interfaces';

export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  private logger = new Logger(OidcStrategy.name, { timestamp: true });

  claimsService: ClaimsService;
  userinfoService: UserInfoService;

  constructor(
    private options: Omit<StrategyOptions, 'passReqToCallback'> & {
      loadUserInfo?: boolean;
      filterProtocolClaims?: boolean | string[];
      mergeClaimsStrategy?: { array: 'replace' | 'merge' };
      tenantId?: string;
      channelType?: ChannelType;
    },
  ) {
    super({
      client: options.client,
      params: options.params,
      extras: options.extras,
      passReqToCallback: false,
      usePKCE: options.usePKCE,
      sessionKey: options.sessionKey,
    });

    this.claimsService = new ClaimsService({
      filterProtocolClaims: options.filterProtocolClaims ?? true,
      mergeClaimsStrategy: options.mergeClaimsStrategy ?? { array: 'replace' },
    });
    this.userinfoService = new UserInfoService(options.client);
  }

  async validate(tokenset: TokenSet) {
    const id_token = tokenset.id_token;
    if (!id_token) {
      throw new UnauthorizedException('id_token is invalid!');
    }

    if (tokenset.expired()) {
      throw new UnauthorizedException('token is expired!');
    }

    await this.processClaims(tokenset);

    tokenset.profile['tenant_id'] = this.options.tenantId;
    tokenset.profile['channel_type'] = this.options.channelType;

    const user = this.userinfoService.build(tokenset);

    return user;
  }

  /**
   * process userinfo claims from id token and userinfo endpoint(optional)
   */
  private async processClaims(tokenset: TokenSet, skipUserInfo = false, validateSub = true): Promise<void> {
    tokenset.profile = this.claimsService.filterProtocolClaims(tokenset.claims());

    if (skipUserInfo || !this.options.loadUserInfo || !tokenset.access_token) {
      this.logger.debug('not loading user info');
      return;
    }

    this.logger.debug('loading user info');
    const claims = await this.userinfoService.getClaims(tokenset.access_token!);
    this.logger.debug('user info claims received from user info endpoint');

    if (validateSub && claims.sub !== tokenset.profile.sub) {
      throw new Error('subject from UserInfo response does not match subject in ID Token');
    }

    tokenset.profile = this.claimsService.mergeClaims(
      tokenset.profile,
      this.claimsService.filterProtocolClaims(claims as IdTokenClaims),
    );
    this.logger.debug('user info claims received, updated profile:', tokenset.profile);
  }
}
