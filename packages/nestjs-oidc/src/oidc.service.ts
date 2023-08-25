import jwt, { Jwt } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { Logger, Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from './errors/unauthorized.error';
import { AdjustOidcOptions } from './interfaces/oidc-options.interface';
import { OIDC_OPTIONS } from './constants';

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name, { timestamp: true });

  constructor(@Inject(OIDC_OPTIONS) private readonly options: AdjustOidcOptions) {}

  decode(token: string): Jwt['payload'] | undefined {
    let decodedToken: jwt.Jwt | null;

    try {
      decodedToken = jwt.decode(token, { complete: true });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    return decodedToken?.payload;
  }

  async verify(token: string): Promise<Jwt['payload'] | undefined> {
    const { issuer, jwksRsa: jwksRasOptions, algorithms = ['RS256'] } = this.options;

    let decodedToken: jwt.Jwt | null;

    try {
      decodedToken = jwt.decode(token, { complete: true });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    const getVerificationKey = (decodedToken: jwksRsa.DecodedToken): Promise<string> =>
      new Promise((resolve, reject) => {
        const callback = jwksRsa.hapiJwt2Key(jwksRasOptions);

        callback(decodedToken, (err, publicKey) => {
          if (err) {
            reject(err);
          } else {
            resolve(publicKey);
          }
        });
      });

    const key = await getVerificationKey({ header: decodedToken?.header as any });

    try {
      jwt.verify(token, key, {
        issuer: [issuer, issuer.substring(0, issuer.length - 1)], // end with "/"" problem
        algorithms,
      });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    return decodedToken?.payload;
  }
}
