import { ModuleMetadata, Type } from '@nestjs/common';
import { Options } from 'sequelize';

export interface IdentityOptions {
  /**
   * is global module
   */
  isGlobal?: boolean;

  /**
   * database connection
   * https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database
   */
  connection: string | Options;

  /**
   * table prefix
   */
  tablePrefix?: string;

  /**
   * translate function
   * @param key key
   * @param fallback fallback value
   */
  translate?: (key: string, fallback: string, args?: Record<string, any>) => string;
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
