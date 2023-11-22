// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Injectable, Logger } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { JwtClaims } from './interfaces';

@Injectable()
export class UserInfoService {
  protected readonly logger = new Logger(UserInfoService.name);

  public async getClaims(token: string, oidcService: OidcService, idpKey: string): Promise<JwtClaims> {
    if (!token) {
      throw new Error('No token passed');
    }

    const claims = await oidcService.idpInfos[idpKey].client.userinfo(token);
    this.logger.debug('got claims', claims);

    return claims;
  }
}
