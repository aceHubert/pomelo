import { ModuleMetadata, Type } from '@nestjs/common';

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

export interface SubModuleOptionsFactory {
  createSubModuleOptions: () => Promise<UnpkgSubModuleOptions> | UnpkgSubModuleOptions;
}

export interface SubModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SubModuleOptionsFactory>;
  useClass?: Type<SubModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<UnpkgSubModuleOptions> | UnpkgSubModuleOptions;
  inject?: any[];
}
