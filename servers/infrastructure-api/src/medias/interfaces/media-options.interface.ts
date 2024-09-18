import { ModuleMetadata, Type } from '@nestjs/common';
import { ImageScaleType } from './media.interface';

export interface MediaOptions {
  /**
   * Upload directory，path to static server URL
   * @default process.cwd()
   */
  dest?: string;
  /**
   * File group by,
   * @default 'month'
   */
  groupBy?: 'month' | 'year';
  /**
   * prefix append to static server URL
   * @default 'uploads'
   */
  staticPrefix?: string;
  /**
   * Scale image quality
   */
  quality?: number | Record<ImageScaleType, number>;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface MediaOptionsFactory {
  createFileOptions(): Promise<Omit<MediaOptions, 'isGlobal'>> | Omit<MediaOptions, 'isGlobal'>;
}

export interface FileAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<MediaOptionsFactory>;
  useClass?: Type<MediaOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<MediaOptions, 'isGlobal'>> | Omit<MediaOptions, 'isGlobal'>;
  inject?: any[];
}
