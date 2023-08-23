import { ModuleMetadata, Type } from '@nestjs/common';
import { Options, ModelOptions } from 'sequelize';

export interface SequelizeEntityOptions {
  connection:
    | string
    | (Pick<Options, 'host' | 'port' | 'dialect' | 'database' | 'username' | 'password'> &
        Pick<ModelOptions, 'charset' | 'collate'>);
  tablePrefix?: string;
}

export interface SequelizeEntityOptionsFactory {
  createSequlizeEntityOptions(): Promise<SequelizeEntityOptions> | SequelizeEntityOptions;
}

export interface SequelizeEntityAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SequelizeEntityOptionsFactory>;
  useClass?: Type<SequelizeEntityOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<SequelizeEntityOptions> | SequelizeEntityOptions;
  inject?: any[];
}
