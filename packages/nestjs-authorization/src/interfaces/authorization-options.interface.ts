import { ModuleMetadata, Type } from '@nestjs/common';
import { JWTHeaderParameters, JWTVerifyGetKey, KeyLike, PEMImportOptions, JWTPayload } from 'jose';
import { ClientMetadata, HttpOptions } from 'openid-client';
import { ChannelType } from './multitenant.interface';

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface RequestUser extends JWTPayload {}

export type AuthorizationOptions = {
  /**
   * Private key to sign the jwt token.
   */
  signingKey?: string | KeyLike;

  /**
   * Public key to verify the jwt token.
   */
  verifyingKey?: string | KeyLike | JWTVerifyGetKey;

  /**
   * JWT expires in time.
   * @default 1d
   */
  jwtExpiresIn?: string | number;

  /**
   * JWT header parameters for singing jwt.
   * @default { alg: 'RS256' }
   */
  jwtHeaderParameters?: JWTHeaderParameters;

  /**
   * Options for importing string keys.
   */
  pemImportOptions?: PEMImportOptions;

  /**
   * Use jwks to verify the jwt token.
   * issuer/issuerOrigin must be provided if set true.
   */
  useJWKS?: boolean;

  /**
   * URL of the token verification endpoint of the identity server,
   * if discover endpoint did not provide this metadata, use this.
   */
  introspectionEndpoint?: string;

  /**
   * Authentication method name for token introspection,
   * if discover endpoint did not provide this metadata, use this.
   * @default client_secret_basic
   */
  introspectionEndpointAuthMethod?: string;

  /**
   * openid-client http options
   */
  httpOptions?: HttpOptions;

  /**
   * factory to get user from request
   * @example apisix openid-connect(https://apisix.apache.org/docs/apisix/plugins/openid-connect/)
   */
  userFactory?: (req: any) => { payload?: RequestUser } | undefined;

  /**
   * Determines what property on `request`
   * @default user.
   */
  userProperty?: string;

  /**
   * check user role permission
   * @param user user info
   * @param roles roles on method or class
   */
  checkRolePremissionFactory?: (user: RequestUser, roles: string[]) => boolean;

  /**
   * Disable to register User Middleware
   * @default false
   */
  disableMiddleware?: boolean;

  /**
   * is global module
   */
  isGlobal?: boolean;
} & XOR<
  {
    /**
     * Discovery endpoint URL of the identity server.
     */
    issuer?: string;
    /**
     * Client metadata for the openid-client.
     */
    clientMetadata?: ClientMetadata;
  },
  { issuerOrigin: string } & ({ [ChannelType.b2c]: ChannelOptions } | { [ChannelType.b2e]: ChannelOptions }) & {
      /**
       * Channel type for Multitenant.
       */
      channelType?: ChannelType;
    }
>;

interface ChannelOptions {
  /**
   * Client metadata for the openid-client.
   */
  clientMetadata: ClientMetadata;
}

export interface AuthorizationOptionsFactory {
  createAuthorizationOptions(): Promise<AuthorizationOptions> | AuthorizationOptions;
}

export interface AuthorizationAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<AuthorizationOptionsFactory>;
  useClass?: Type<AuthorizationOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<AuthorizationOptions> | AuthorizationOptions;
  inject?: any[];
}
