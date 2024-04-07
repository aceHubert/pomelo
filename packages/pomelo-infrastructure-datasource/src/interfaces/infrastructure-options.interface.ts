import { ModuleMetadata, Type } from '@nestjs/common';
import { Options } from 'sequelize';

export interface InfrastructureOptions {
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

export interface InfrastructureOptionsFactory {
  createSequlizeOptions(): Promise<Omit<InfrastructureOptions, 'isGlobal'>> | Omit<InfrastructureOptions, 'isGlobal'>;
}

export interface InfrastructureAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<InfrastructureOptionsFactory>;
  useClass?: Type<InfrastructureOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<InfrastructureOptions, 'isGlobal'>> | Omit<InfrastructureOptions, 'isGlobal'>;
  inject?: any[];
}
