import { ModuleMetadata, Type } from '@nestjs/common';

export interface OidcConfigOptions {
  /**
   * Issuer Identifier, URL using the https scheme with no query or fragment component.
   */
  issuer: string;

  /**
   * path base
   * @default /oidc
   */
  path?: string;

  /**
   * resource url
   */
  resource?: string;

  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface OidcConfigOptionsFactory {
  createOidcConfigOptions(): Promise<Omit<OidcConfigOptions, 'isGlobal'>> | Omit<OidcConfigOptions, 'isGlobal'>;
}

export interface OidcConfigAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<OidcConfigOptionsFactory>;
  useClass?: Type<OidcConfigOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<OidcConfigOptions, 'isGlobal'>> | Omit<OidcConfigOptions, 'isGlobal'>;
  inject?: any[];
}
