import { ModuleMetadata, Type } from '@nestjs/common';

export interface FileOptions {
  /**
   * Upload directory, will try to create if not exists
   * @default [process.cwd()]/uploads
   */
  dest?: string;
  /**
   * File group by,
   * @default month
   */
  groupBy?: 'month' | 'year';
  /**
   * prefix append to static server URL
   * @default uploads
   */
  staticPrefix?: string;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface FileOptionsFactory {
  createFileOptions(): Promise<Omit<FileOptions, 'isGlobal'>> | Omit<FileOptions, 'isGlobal'>;
}

export interface FileAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<FileOptionsFactory>;
  useClass?: Type<FileOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<FileOptions, 'isGlobal'>> | Omit<FileOptions, 'isGlobal'>;
  inject?: any[];
}
