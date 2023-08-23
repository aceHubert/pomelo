import { ModuleMetadata, Type } from '@nestjs/common';
import { Algorithm } from 'jsonwebtoken';
import { TokenGetter, IsRevoked } from 'express-jwt';
import { Params } from 'express-unless';
import { Options as JwksRasOptions } from 'jwks-rsa';
import { OidcMetadata } from './oidc-metadata.interface';

export interface JwtOptions {
  /**
   * Oidc server host
   */
  endpoint: string;
  /**
   * jwks-ras options
   */
  jwksRsa?: Partial<JwksRasOptions>;
  /**
   * Defines how to retrieves the token from the request object.
   */
  getToken?: TokenGetter;
  /**
   * Defines how to verify if a token is revoked.
   */
  isRevoked?: IsRevoked;
  /**
   * If sets to true, continue to the next middleware when the
   * request doesn't include a token without failing.
   *
   * @default true
   */
  credentialsRequired?: boolean;
  /**
   * Allows to customize the name of the property in the request object
   * where the decoded payload is set.
   * @default 'auth'
   */
  requestProperty?: string;
  /**
   * List of JWT algorithms allowed.
   */
  algorithms?: Algorithm[];
  /**
   * unless middleware for express-jwt
   */
  unless?: Params;
  /**
   * show logs
   */
  logging?: boolean;
  /**
   * disable to use middleware in configure
   */
  disableMiddleware?: boolean;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface AdjustJwtOptions extends Omit<JwtOptions, 'endpoint' | 'jwksRas' | 'isGlobal'>, OidcMetadata {
  jwksRsa: JwksRasOptions;
}

export interface JwtOptionsFactory {
  createJwtOptions(): Promise<JwtOptions> | JwtOptions;
}

export interface JwtAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<JwtOptionsFactory>;
  useClass?: Type<JwtOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<JwtOptions> | JwtOptions;
  inject?: any[];
}
