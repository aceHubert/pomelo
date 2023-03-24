import { ModuleMetadata, Type } from '@nestjs/common';
import { Use } from '../constants';

export type FileOptions<UseOptions extends LocalFileOptions | ObsFileOptions> = {
  /**
   * service inUse
   */
  use?: Use | Use[];

  /**
   * is global module
   */
  isGlobal?: boolean;
} & UseOptions;

export interface LocalFileOptions {
  /**
   * Upload directory
   */
  dist?: string;

  /**
   * Limit file max size(KB)
   */
  limit?: number;
}

export interface ObsFileOptions {
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
}

export interface FileOptionsFactory<UseOptions extends LocalFileOptions | ObsFileOptions> {
  createFileOptions(): Promise<UseOptions> | UseOptions;
}

export interface FileAsyncOptions<UseOptions extends LocalFileOptions | ObsFileOptions>
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * service inUse
   */
  use?: Use | Use[];
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<FileOptionsFactory<UseOptions>>;
  useClass?: Type<FileOptionsFactory<UseOptions>>;
  useFactory?: (...args: any[]) => Promise<UseOptions> | UseOptions;
  inject?: any[];
}
