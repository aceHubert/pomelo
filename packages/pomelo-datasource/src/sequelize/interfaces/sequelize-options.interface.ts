import { ModuleMetadata, Type } from '@nestjs/common';
import { Options, ModelOptions } from 'sequelize';

export interface SequelizeOptions {
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

export interface SequelizeOptionsFactory {
  createSequlizeOptions(): Promise<Omit<SequelizeOptions, 'isGlobal'>> | Omit<SequelizeOptions, 'isGlobal'>;
}

export interface SequelizeAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<SequelizeOptionsFactory>;
  useClass?: Type<SequelizeOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<SequelizeOptions, 'isGlobal'>> | Omit<SequelizeOptions, 'isGlobal'>;
  inject?: any[];
}
