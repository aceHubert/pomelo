import { ModuleMetadata, Type } from '@nestjs/common';
import { KeyLike, JWTVerifyGetKey } from 'jose';
import { ClientMetadata, HttpOptions } from 'openid-client';
import { ChannelType } from './multitenant.interface';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface RequestUser {
  [x: string]: unknown;
}

export type AuthorizationOptions = {
  /**
   * Public key to verify the jwt token.
   */
  publicKey?: KeyLike | JWTVerifyGetKey;

  /**
   * Discovery endpoint URL of the identity server.
   */
  issuer?: string;

  /**
   * Use jwks to verify the jwt token.
   */
  useJWKS?: boolean;

  /**
   * openid-client http options
   */
  httpOptions?: HttpOptions;

  /**
   * apisix openid-connect
   * https://apisix.apache.org/docs/apisix/plugins/openid-connect/
   */
  setUserinfoHeader?: string;

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
