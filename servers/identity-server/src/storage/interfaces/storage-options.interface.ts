import { ModuleMetadata, Type } from '@nestjs/common';

export interface StorageOptions {
  /**
   * redis url
   */
  redis?: string;

  // TODO: add more storage options

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
