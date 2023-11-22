import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { OidcService } from '../oidc.service';
import { authenticateExternalIdps } from '../utils';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private oidcService: OidcService) {}

  async use(req: any, res: any, next: Function) {
    try {
      const jwt = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (!jwt) throw new Error('No JWT found in request!');

      const { tenantId, channelType } = this.oidcService.getMultitenantParamsFromRequest(req);

      const payload = await this.oidcService.verifyToken(jwt, tenantId, channelType);

      if (this.oidcService.options.externalIdps) {
        payload.external_idps = await authenticateExternalIdps(this.oidcService.options.externalIdps);
      }

      payload['tenant_id'] = tenantId;
      payload['channel_type'] = channelType;

      req.user = payload;

      next();
    } catch (err) {
      next();
    }
  }
}
