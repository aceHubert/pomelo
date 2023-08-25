import jwksRsa from 'jwks-rsa';
import { HttpAdapterHost } from '@nestjs/core';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { AdjustOidcOptions } from './interfaces/oidc-options.interface';
import { OIDC_OPTIONS } from './constants';

@Injectable()
export class OidcMiddleware implements NestMiddleware {
  private readonly logger = new Logger(OidcMiddleware.name, { timestamp: true });

  constructor(
    @Inject(OIDC_OPTIONS) private readonly options: AdjustOidcOptions,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  use(req: any, res: any, next: () => void) {
    const platformName = this.httpAdapterHost.httpAdapter.getType();

    const {
      issuer,
      unless,
      jwksRsa: jwksRasOptions,
      requestProperty,
      algorithms = ['RS256'],
      credentialsRequired,
      getToken,
      isRevoked,
    } = this.options;
    if (platformName === 'express') {
      const { expressjwt } = loadPackage('express-jwt', 'JwtModule', () => require('express-jwt'));
      const middleware = expressjwt({
        secret: jwksRsa.expressJwtSecret(jwksRasOptions),
        issuer: [issuer, issuer.substring(0, issuer.length - 1)], // end with "/"" problem
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
