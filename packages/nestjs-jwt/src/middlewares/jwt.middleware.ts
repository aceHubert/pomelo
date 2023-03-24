import jwksRsa from 'jwks-rsa';
import { HttpAdapterHost } from '@nestjs/core';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { JWT_OPTIONS } from '../constants';

// Types
import type { JwtOptions } from '../interfaces/jwt-options.interface';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name, { timestamp: true });

  constructor(
    @Inject(JWT_OPTIONS) private readonly options: JwtOptions,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  use(req: any, res: any, next: () => void) {
    const platformName = this.httpAdapterHost.httpAdapter.getType();

    const {
      endpoint: jwksHost,
      unless,
      jwksRsa: jwksRasOptions = {},
      requestProperty,
      algorithms = ['RS256'],
      credentialsRequired,
      getToken,
      isRevoked,
    } = this.options;
    if (platformName === 'express') {
      const { expressjwt } = loadPackage('express-jwt', 'JwtModule', () => require('express-jwt'));
      const middleware = expressjwt({
        secret: jwksRsa.expressJwtSecret({
          ...jwksRasOptions,
          jwksUri: jwksRasOptions.jwksUri || `${jwksHost}.well-known/openid-configuration/jwks`,
        }),
        issuer: [jwksHost, jwksHost.substring(0, jwksHost.length - 1)], // end with "/"" problem
        algorithms,
        requestProperty,
        credentialsRequired,
        getToken,
        isRevoked,
      });
      if (unless) {
        middleware.unless(unless)(req, res, next);
      } else {
        middleware(req, res, next);
      }
    } else {
      // TODO
      this.logger.error(`platform "${platformName}" have not supportted yet!`);
      next();
    }
  }
}
