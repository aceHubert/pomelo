import { ModuleMetadata, Type } from '@nestjs/common';
import { CountryCode } from 'libphonenumber-js';
import { SequelizeOptions } from '../../datasource/sequelize/sequelize';

export interface UserDatasourceOptions {
  connection: string | SequelizeOptions;
  tablePrefix?: string;
  phoneRegionCode?: CountryCode;
  isGlobal?: boolean;
}

export interface UserDatasourceOptionsFactory {
  createUserDatasourceOptions():
    | Promise<Omit<UserDatasourceOptions, 'isGlobal'>>
    | Omit<UserDatasourceOptions, 'isGlobal'>;
}

export interface UserDatasourceAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<UserDatasourceOptionsFactory>;
  useClass?: Type<UserDatasourceOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<UserDatasourceOptions, 'isGlobal'>> | Omit<UserDatasourceOptions, 'isGlobal'>;
  inject?: any[];
}
