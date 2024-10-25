import { Injectable, Inject, Logger, NestMiddleware } from '@nestjs/common';
import { JWTPayload } from 'jose';
import { AuthorizationService } from './authroized.service';
import { fromAuthHeaderAsBearerToken } from './utils/extract-jwt';
import { AuthorizationOptions } from './interfaces/authorization-options.interface';
import { AUTHORIZATION_OPTIONS } from './constants';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  private logger = new Logger(UserMiddleware.name, { timestamp: true });

  constructor(
    @Inject(AUTHORIZATION_OPTIONS) private readonly options: AuthorizationOptions,
    private authService: AuthorizationService,
  ) {}

  async use(req: any, res: any, next: Function) {
    try {
      const { tenantId, channelType } = this.authService.getMultitenantParamsFromRequest(req);

      let userStr: string, payload: JWTPayload;
      if ((userStr = req.headers[this.options.setUserinfoHeader!] as string)) {
        // from apisix
        payload = JSON.parse(Buffer.from(userStr, 'base64').toString('utf-8'));
      } else {
        // from Authroization header
        const accessToken = fromAuthHeaderAsBearerToken(req);
        if (!accessToken) throw new Error('No bearer token found in request!');

        payload = await this.authService.verifyToken(accessToken);
      }

      payload['tenant_id'] = tenantId;
      payload['channel_type'] = channelType;

      req[this.options.userProperty!] = payload;

      next();
    } catch (err: any) {
      this.logger.debug(err.message);
      next();
    }
  }
}
