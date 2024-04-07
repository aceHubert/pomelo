import { ModuleMetadata, Type } from '@nestjs/common';
import { StorageAdpter } from './storage.adpter';

export interface StorageOptions {
  /**
   * storage
   */
  use: StorageAdpter;

  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface StorageOptionsFactory {
  createStorageOptions(): Promise<Omit<StorageOptions, 'isGlobal'>> | Omit<StorageOptions, 'isGlobal'>;
}

export interface StorageAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<StorageOptionsFactory>;
  useClass?: Type<StorageOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<StorageOptions, 'isGlobal'>> | Omit<StorageOptions, 'isGlobal'>;
  inject?: any[];
}
