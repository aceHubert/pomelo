import { ModuleMetadata, Type } from '@nestjs/common';
import { Configuration } from 'log4js';

export interface Log4jsOptions extends Configuration {
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface Log4jsOptionsFactory {
  createLog4jsOptions(): Promise<Partial<Log4jsOptions>> | Partial<Log4jsOptions>;
}

export interface Log4jsAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<Log4jsOptionsFactory>;
  useClass?: Type<Log4jsOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Partial<Log4jsOptions>> | Partial<Log4jsOptions>;
  inject?: any[];
}
