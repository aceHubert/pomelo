// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, UnauthorizedException } from '@nestjs/common';
import { BaseClient, TokenSet, UserinfoResponse } from 'openid-client';
import { User } from './user';
import { JwtClaims } from './claims.interface';

export class UserInfoService<TClient extends BaseClient = BaseClient> {
  protected readonly logger = new Logger(UserInfoService.name);

  constructor(private client: TClient) {}

  /**
   * get claims from userinfo endpoint
   * @param accessToken Access token
   */
  async getClaims(accessToken: string): Promise<UserinfoResponse<JwtClaims>> {
    if (!accessToken) {
      throw new Error('No token passed');
    }

    const claims = await this.client.userinfo(accessToken);
    this.logger.debug('got claims', claims);

    return claims;
  }

  /**
   * build user
   * @param tokenset TokenSet
   * @param verifySub Sub to verify
   */
  build(tokenset: TokenSet, verifySub?: string) {
    const user = new User({
      id_token: tokenset.id_token,
      session_state: tokenset.session_state,
      access_token: tokenset.access_token!,
      refresh_token: tokenset.refresh_token,
      token_type: tokenset.token_type || 'Bearer',
      scope: tokenset.scope,
      profile: tokenset.profile,
      expires_at: tokenset.expires_at,
    });

    if (verifySub) {
      if (verifySub !== user.profile.sub) {
        this.logger.debug('current user does not match user returned from signin. sub from signin:', user.profile.sub);
        throw new UnauthorizedException(tokenset, { description: 'login_required' });
      }
      this.logger.debug('current user matches user returned from signin');
    }

    return user;
  }
}
