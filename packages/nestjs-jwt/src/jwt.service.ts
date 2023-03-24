import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { Logger, Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from './errors/UnauthorizedError';
import { JWT_OPTIONS } from './constants';

// Types
import type { JwtOptions } from './interfaces/jwt-options.interface';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name, { timestamp: true });

  constructor(@Inject(JWT_OPTIONS) private readonly options: JwtOptions) {}

  decode(token: string): string | jwt.JwtPayload | undefined {
    let decodedToken: jwt.Jwt | null;

    try {
      decodedToken = jwt.decode(token, { complete: true });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    return decodedToken?.payload;
  }

  async verify(token: string): Promise<string | jwt.JwtPayload | undefined> {
    const { endpoint: jwksHost, jwksRsa: jwksRasOptions = {}, algorithms = ['RS256'] } = this.options;

    let decodedToken: jwt.Jwt | null;

    try {
      decodedToken = jwt.decode(token, { complete: true });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    const getVerificationKey = (decodedToken: jwksRsa.DecodedToken): Promise<string> =>
      new Promise((resolve, reject) => {
        const callback = jwksRsa.hapiJwt2Key({
          ...jwksRasOptions,
          jwksUri: jwksRasOptions.jwksUri || `${jwksHost}.well-known/openid-configuration/jwks`,
        });

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
        issuer: [jwksHost, jwksHost.substring(0, jwksHost.length - 1)], // end with "/"" problem
        algorithms,
      });
    } catch (err) {
      this.options.logging && this.logger.error(`Invalid token, ${(err as Error).message}`);
      throw new UnauthorizedError('invalid_token', err as Error);
    }

    return decodedToken?.payload;
  }
}
