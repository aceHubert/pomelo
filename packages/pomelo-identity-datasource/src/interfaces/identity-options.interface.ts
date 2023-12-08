import { ModuleMetadata, Type } from '@nestjs/common';
import { Options, ModelOptions } from 'sequelize';

export interface IdentityOptions {
  /**
   * is global module
   */
  isGlobal?: boolean;

  /**
   * database connection
   */
  connection:
    | string
    | (Pick<Options, 'host' | 'port' | 'dialect' | 'database' | 'username' | 'password'> &
        Pick<ModelOptions, 'charset' | 'collate'>);

  /**
   * table prefix
   */
  tablePrefix?: string;

  /**
   * translate function
   * @param key key
   * @param fallback fallback value
   */
  translate?: (
    key: string,
    fallback: string,
    options?: {
      lang?: string;
      args?: Record<string, any>;
    },
  ) => string;
}

export interface IdentityOptionsFactory {
  createSequlizeOptions(): Promise<Omit<IdentityOptions, 'isGlobal'>> | Omit<IdentityOptions, 'isGlobal'>;
}

export interface IdentityAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<IdentityOptionsFactory>;
  useClass?: Type<IdentityOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<IdentityOptions, 'isGlobal'>> | Omit<IdentityOptions, 'isGlobal'>;
  inject?: any[];
}
