import { ModuleMetadata, Type } from '@nestjs/common';
import { Options } from 'sequelize';

export interface IdentityDatasourceOptions {
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

  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface IdentityDatasourceOptionsFactory {
  createSequlizeOptions():
    | Promise<Omit<IdentityDatasourceOptions, 'isGlobal'>>
    | Omit<IdentityDatasourceOptions, 'isGlobal'>;
}

export interface IdentityDatasourceAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<IdentityDatasourceOptionsFactory>;
  useClass?: Type<IdentityDatasourceOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<IdentityDatasourceOptions, 'isGlobal'>> | Omit<IdentityDatasourceOptions, 'isGlobal'>;
  inject?: any[];
}
