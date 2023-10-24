import { typedUrl } from '@ace-fetch/core';
import { defineRegistApi } from '@ace-fetch/vue';
import { getEnv } from '@ace-util/core';

/**
 * prefix 需要注册到window._ENV上
 */
export const useSubmoduleApi = defineRegistApi('__SUBMODULES__', {
  apis: {
    getSubModules: typedUrl<PagedResp<PagedSubModuleItem>, PagedSubModuleQuery>`submodules`,
    getSubModule: typedUrl<SubModule, { name: string; version?: string }>`submodules/${'name'}`,
    getSubModuleManifest: typedUrl<
      SubModuleManifest,
      { name: string; version?: string }
    >`submodules/${'name'}/manifest`,
  },
  prefix: getEnv('apiBase', '/api', (window as any)._ENV),
});

export interface PagedDto {
  limit?: number;
  offset?: number;
}

export interface PagedResp<Item> {
  rows: Item[];
  total: number;
}

export interface PagedSubModuleQuery extends PagedDto {
  name?: string;
}

export interface VersionModel {
  /**
   * Version
   */
  version: string;

  /**
   * Created time
   */
  createdAt: string;
}

export interface AuhtorModel {
  /**
   * Author name
   */
  name?: string;

  /**
   * Author username
   */
  username?: string;

  /**
   * Author email
   */
  email?: string;
}
export interface TagModel {
  /**
   * Tag name
   */
  name: string;
  /**
   * Tag version
   */
  version: string;
}

export interface DistInfo {
  /**
   * Tarball URL
   */
  tarball: string;

  /**
   * Number of files in the tarball
   */
  fileCount?: number;

  /**
   * Total size in bytes of the unpacked files in the tarball
   */
  unpackedSize?: number;
}

export interface ModuleConfig {
  /**
   * Module entry
   */
  entry: string;

  /**
   * Module props (from propsSchema)
   */
  props?: Record<string, unknown>;
}

export interface PagedSubModuleItem {
  /**
   * Sub-module package name
   */
  name: string;
  /**
   * Description
   */
  description?: string;
  /**
   *  Latest package version number
   */
  version: string;

  /**
   * Package publisher
   */
  publisher: AuhtorModel;

  /**
   *  Publishing timestamp for the latest version
   */
  createdAt: string;
}

export interface SubModule {
  /**
   * Unique package name
   */
  id: string;
  /**
   * Sub-module package name
   */
  name: string;
  /**
   * Description
   */
  description?: string;
  /**
   * Versions
   */
  versions: VersionModel[];
  /**
   * Tags
   */
  tags: TagModel[];
  /**
   * README contents
   */
  readme?: string;
  /**
   * Name of the README file
   * */
  readmeFilename?: string;
}

export interface SubModuleManifest extends Pick<SubModule, 'id' | 'name' | 'description'> {
  /**
   * Package version number
   */
  version: string;

  /**
   * Package main entry
   */
  main?: string;

  /**
   * Package publisher
   */
  publisher: AuhtorModel;

  /**
   * Dist info
   */
  dist: DistInfo;

  /**
   * Module configs (multiple config support)
   */
  moduleConfigs: ModuleConfig[];

  /**
   * Sub-module props schema (JSON schema for moduleConfig.props)
   */
  propsSchema: Record<string, unknown>;
  /**
   *  Publishing timestamp
   */
  createdAt: string;
}
