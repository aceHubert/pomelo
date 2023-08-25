import { ModuleMetadata, Type } from '@nestjs/common';
import { Algorithm } from 'jsonwebtoken';
import { TokenGetter, IsRevoked } from 'express-jwt';
import { Params } from 'express-unless';
import { Options as JwksRasOptions } from 'jwks-rsa';
import { OidcMetadata } from './oidc-metadata.interface';

export interface OidcOptions {
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

export interface AdjustOidcOptions extends Omit<OidcOptions, 'endpoint' | 'jwksRas' | 'isGlobal'>, OidcMetadata {
  jwksRsa: JwksRasOptions;
}

export interface OidcOptionsFactory {
  createOidcOptions(): Promise<OidcOptions> | OidcOptions;
}

export interface OidcAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<OidcOptionsFactory>;
  useClass?: Type<OidcOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<OidcOptions> | OidcOptions;
  inject?: any[];
}
