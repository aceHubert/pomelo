import { ModuleMetadata, Type } from '@nestjs/common';
import { Options, ModelOptions } from 'sequelize';

export interface EntityModuleOptions {
  connection:
    | string
    | (Pick<Options, 'host' | 'port' | 'dialect' | 'database' | 'username' | 'password'> &
        Pick<ModelOptions, 'charset' | 'collate'>);
  tablePrefix?: string;
}

export interface EntityOptionsFactory {
  createEntityOptions(): Promise<EntityModuleOptions> | EntityModuleOptions;
}

export interface EntityModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<EntityOptionsFactory>;
  useClass?: Type<EntityOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<EntityModuleOptions> | EntityModuleOptions;
  inject?: any[];
}
