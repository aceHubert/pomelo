import { ModuleMetadata, Type } from '@nestjs/common';
import { Options, ModelOptions } from 'sequelize';

export interface InfrastructureOptions {
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
