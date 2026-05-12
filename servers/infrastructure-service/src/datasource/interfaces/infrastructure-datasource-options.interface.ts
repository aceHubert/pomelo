import { ModuleMetadata, Type } from '@nestjs/common';
import { Options } from 'sequelize';

export interface InfrastructureDatasourceOptions {
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

export interface InfrastructureDatasourceOptionsFactory {
  createSequlizeOptions():
    | Promise<Omit<InfrastructureDatasourceOptions, 'isGlobal'>>
    | Omit<InfrastructureDatasourceOptions, 'isGlobal'>;
}

export interface InfrastructureDatasourceAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<InfrastructureDatasourceOptionsFactory>;
  useClass?: Type<InfrastructureDatasourceOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<InfrastructureDatasourceOptions, 'isGlobal'>> | Omit<InfrastructureDatasourceOptions, 'isGlobal'>;
  inject?: any[];
}
