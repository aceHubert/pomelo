import { ModuleMetadata, Type } from '@nestjs/common';
import { Options } from 'sequelize';

export interface InfrastructureOptions {
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
  translate?: (
    key: string,
    fallback: string,
    options?: {
      lang?: string;
      args?: Record<string, any>;
    },
  ) => string;
}

export interface InfrastructureOptionsFactory {
  createSequlizeOptions(): Promise<Omit<InfrastructureOptions, 'isGlobal'>> | Omit<InfrastructureOptions, 'isGlobal'>;
}

export interface InfrastructureAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<InfrastructureOptionsFactory>;
  useClass?: Type<InfrastructureOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<InfrastructureOptions, 'isGlobal'>> | Omit<InfrastructureOptions, 'isGlobal'>;
  inject?: any[];
}
