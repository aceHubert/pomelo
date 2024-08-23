import { Injectable, NestMiddleware } from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { JWTPayload } from 'jose';
import { OidcService } from '../oidc.service';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private oidcService: OidcService) {}

  async use(req: any, res: any, next: Function) {
    try {
      const { tenantId, channelType } = this.oidcService.getMultitenantParamsFromRequest(req);

      let userStr: string, payload: JWTPayload;

      if ((userStr = req.headers[this.oidcService.setUserinfoHeader] as string)) {
        // from apisix
        payload = JSON.parse(Buffer.from(userStr, 'base64').toString('utf-8'));
      } else {
        // from Authroization header
        const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!accessToken) throw new Error('No bearer token found in request!');

        payload = await this.oidcService.verifyToken(accessToken, tenantId, channelType);
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
