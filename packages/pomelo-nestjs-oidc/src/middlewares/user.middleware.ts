import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { OidcService } from '../oidc.service';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private oidcService: OidcService) {}

  async use(req: any, res: any, next: Function) {
    try {
      const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (!accessToken) throw new Error('No bearer token found in request!');

      const { tenantId, channelType } = this.oidcService.getMultitenantParamsFromRequest(req);

      const payload = await this.oidcService.verifyToken(accessToken, tenantId, channelType);

      payload['tenant_id'] = tenantId;
      payload['channel_type'] = channelType;

      req.user = payload;

      next();
    } catch (err) {
      next();
    }
  }
}
