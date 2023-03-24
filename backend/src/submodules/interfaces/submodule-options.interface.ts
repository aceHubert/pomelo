import { ModuleMetadata, Type } from '@nestjs/common';
import { Use } from '../constants';

export type SubModuleOptions<UseOptions extends UnpkgSubModuleOptions | ObsSubModuleOptions> = {
  /**
   * service inUse
   */
  use?: Use | Use[];
} & UseOptions;

export interface UnpkgSubModuleOptions {
  /**
   * 当全局搜索时对子模块对应的条件
   * special search qualifiers -> keywords, checking on https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage
   */
  keywords: string[];

  /**
   * npm registry endpoint
   * @default https://registry.npmjs.org/
   */
  registry?: string;

  /**
   * 镜像
   * checking on https://www.jsdocs.io/package/query-registry
   */
  mirrors?: string[];

  /**
   * 缓存
   * checking on https://www.jsdocs.io/package/query-registry
   */
  cached?: boolean;
}

export interface ObsSubModuleOptions {
  /**
   * OBS bucket
   */
  bucket: string;

  /**
   * prefix
   */
  prefix?: string;
}

export interface SubModuleOptionsFactory<UseOptions extends UnpkgSubModuleOptions | ObsSubModuleOptions> {
  createSubModuleOptions: () => Promise<UseOptions> | UseOptions;
}

export interface SubModuleAsyncOptions<UseOptions extends UnpkgSubModuleOptions | ObsSubModuleOptions>
  extends Pick<ModuleMetadata, 'imports'> {
  use?: Use | Use[];
  useExisting?: Type<SubModuleOptionsFactory<UseOptions>>;
  useClass?: Type<SubModuleOptionsFactory<UseOptions>>;
  useFactory?: (...args: any[]) => Promise<UseOptions> | UseOptions;
  inject?: any[];
}
