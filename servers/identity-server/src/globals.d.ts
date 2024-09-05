// import { JwtPayload } from 'jsonwebtoken';
import { ResponseSuccess, ResponseError } from '@ace-pomelo/shared/server';

declare global {
  export type ConnectionParams = {
    token?: string;
    lang?: string;
  };

  export type PagedResponseSuccess<T> = ResponseSuccess<{
    rows: Array<T>;
    total: number;
  }>;

  export type ResponseOf<T extends Record<string, any>> = ResponseSuccess<T> | ResponseError;
  export type PagedResponseOf<T> = PagedResponseSuccess<T> | ResponseError;

  export type Dictionary<T> = Record<string, T>;
  /**
   * Type helper for making certain fields of an object optional.
   */
  // export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
}

declare module '@types/oidc-provider' {
  export interface AllClientMetadata {
    /**
     * Multiple client secrets support
     */
    client_secrets?:
      | Array<{
          /**
           * Secret type, 'SharedSecret' | 'PrivateKey'
           * @default 'SharedSecret'
           */
          type?: string | undefined;
          /**
           * Secret value
           */
          value: string;
          /**
           * Secret expiration timestamp
           */
          expires_at?: number | undefined;
        }>
      | undefined;
    /**
     * IdToken lifetime in seconds
     * @default 3600
     */
    id_token_ttl?: number | undefined;
    /**
     * AccessToken format 'opaque' | 'jwt'
     * @default 'opaque'
     */
    access_token_format?: TokenFormat | undefined;
    /**
     * AccessToken lifetime in seconds
     * @default 3600
     */
    access_token_ttl?: number | undefined;
    /**
     * RefreshToken expiration type
     * @default 'absolute'
     */
    refresh_token_expiration?: 'absolute' | 'sliding' | undefined;
    /**
     * RefreshToken lifetime in seconds in case of 'absolute' expiration type
     * @default 2592000
     */
    refresh_token_absolute_ttl?: number | undefined;
    /**
     * RefreshToken lifetime in seconds in case of 'sliding' expiration type
     * @default 1296000
     */
    refresh_token_sliding_ttl?: number | undefined;
    /**
     * AuthorizationCode lifetime in seconds
     * @default 300
     */
    authorization_code_ttl?: number | undefined;
    /**
     * DeviceCode lifetime in seconds
     * @default 300
     */
    device_code_ttl?: number | undefined;
    /**
     * BackchannelAuthenticationRequest lifetime in seconds
     * @default 300
     */
    backchannel_authentication_request_ttl?: number | undefined;
    /**
     * Skip consent screen
     * https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md
     * @default false
     */
    require_consent?: boolean | undefined;
    /**
     * Authorization Code Flow with Proof Key for Code Exchange (PKCE)
     * https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce
     * @default false
     */
    require_pkce?: boolean | undefined;
    /**
     * Allowed CORS origins
     * https://github.com/panva/node-oidc-provider/blob/main/recipes/client_based_origins.md
     */
    allowed_cors_origins?: string[] | undefined;
    /**
     * Extra properties
     */
    extra_properties?: Record<string, string> | undefined;
  }
}

// 注意: 修改"全局声明"必须在模块内部, 所以至少要有 export{}字样
// 不然会报错❌: 全局范围的扩大仅可直接嵌套在外部模块中或环境模块声明中
export {};
