import { ModuleMetadata, Type } from '@nestjs/common';
import { JWKS } from 'oidc-provider';

export interface Storage {
  get<T>(key: string): T | null | undefined | Promise<T | null | undefined>;
  set<T>(key: string, value: T, expiresIn?: number): void | Promise<void>;
  del(key: string): void | Promise<void>;
}

export interface OidcConfigOptions {
  /**
   * allow localhost redirect_uri...
   */
  debug?: boolean;

  /**
   * path base
   * @default /oidc
   */
  path?: string;

  /**
   * json web key set
   */
  jwks?: JWKS;

  /**
   * storage
   */
  storage: Storage;

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
