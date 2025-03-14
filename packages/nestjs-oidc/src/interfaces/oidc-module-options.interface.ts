import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { AuthorizationParameters, ClientMetadata, HttpOptions } from 'openid-client';
import { ChannelType } from './multitenant.interface';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

/**
 * @public
 */
export type ExtraHeader = string | (() => string);

export type OidcModuleOptions = {
  /**
   * The url to the login controller
   */
  origin: string;

  /**
   * Authorization parameters to be sent to the authorization endpoint
   */
  authParams: AuthorizationParameters & {
    /** The OIDC/OAuth2 post-logout redirect URI */
    post_logout_redirect_uri?: string;
  };
  /**
   * Should optional OIDC protocol claims be removed from profile or specify the ones to be removed (default: true)
   * When true, the following claims are removed by default: ["nbf", "jti", "auth_time", "nonce", "acr", "amr", "azp", "at_hash"]
   * When specifying claims, the following claims are not allowed: ["sub", "iss", "aud", "exp", "iat"]
   */
  filterProtocolClaims?: boolean | string[];

  /**
   * Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile (default: false)
   */
  loadUserInfo?: boolean;

  /**
   * Indicates how objects returned from the user info endpoint as claims (e.g. `address`) are merged into the claims from the
   * id token as a single object.  (default: `{ array: "replace" }`)
   * - array: "replace": natives (string, int, float) and arrays are replaced, objects are merged as distinct objects
   * - array: "merge": natives (string, int, float) are replaced, arrays and objects are merged as distinct objects
   */
  mergeClaimsStrategy?: { array: 'replace' | 'merge' };

  /**
   * check user role permission
   * @param user user info
   * @param roles roles on method or class
   */
  checkRolePremissionFactory?: (user: Express.User, roles: string[]) => boolean;

  /**
   * Will use PKCE validation, changing to true will not append to sign in request code_challenge and code_challenge_method. (default: true)
   */
  usePKCE?: boolean;

  /**
   * openid-client http options
   */
  httpOptions?: HttpOptions;

  /**
   * Disable to register Auth Controllers
   * @default false
   */
  disableController?: boolean;

  /**
   * Prompt the login page if the user has already authenticated before
   * @default true
   */
  promptLogin?: boolean;

  /**
   * is global module
   */
  isGlobal?: boolean;
} & XOR<
  {
    issuer: string;
    clientMetadata: ClientMetadata;
  },
  { issuerOrigin: string } & ({ [ChannelType.b2c]: OidcChannelOptions } | { [ChannelType.b2e]: OidcChannelOptions }) & {
      channelType?: ChannelType;
    }
>;

interface OidcChannelOptions {
  clientMetadata: ClientMetadata;
}

export interface OidcOptionsFactory {
  createModuleConfig():
    | Promise<Omit<OidcModuleOptions, 'isGlobal' | 'disableController'>>
    | Omit<OidcModuleOptions, 'isGlobal' | 'disableController'>;
}

export interface OidcModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  /**
   * Disable to register Auth Controllers
   * @default false
   */
  disableController?: boolean;
  useExisting?: Type<OidcOptionsFactory>;
  useClass?: Type<OidcOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<Omit<OidcModuleOptions, 'isGlobal' | 'disableController'>>
    | Omit<OidcModuleOptions, 'isGlobal' | 'disableController'>;
  inject?: any[];
}
