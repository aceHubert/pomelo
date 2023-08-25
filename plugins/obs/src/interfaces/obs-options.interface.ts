import type { ModuleMetadata, Type } from '@nestjs/common';

export interface ObsOptions {
  /**
   * ObsClient access_key_id
   */
  accessKey: string;

  /**
   * ObsClient secret_access_key
   */
  secretKey: string;

  /**
   * ObsClient server
   */
  endpoint: string;

  maxRetryCount?: number;
  timeout?: number;
  sslVerify?: boolean;
  longConnParam?: number;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface ObsOptionsFactory {
  createObsOptions(): Promise<Omit<ObsOptions, 'isGlobal'>> | Omit<ObsOptions, 'isGlobal'>;
}

export interface ObsAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<ObsOptionsFactory>;
  useClass?: Type<ObsOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<ObsOptions, 'isGlobal'>> | Omit<ObsOptions, 'isGlobal'>;
  inject?: any[];
}
