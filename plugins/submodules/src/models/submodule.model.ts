import { Field, Int, ObjectType, PickType, OmitType } from '@nestjs/graphql';
import { JSONResolver, JSONObjectResolver } from 'graphql-scalars';
import { SubModuleConfig } from '../interfaces/submodule-config.interface';

@ObjectType()
export class VersionModel {
  /**
   * Version
   */
  version!: string;

  /**
   * Created time
   */
  createdAt!: Date;
}

@ObjectType()
export class TagModel {
  /**
   * Tag name
   */
  name!: string;

  /**
   * Tag version
   */
  version!: string;
}

@ObjectType()
export class AuhtorModel {
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

@ObjectType()
export class DistInfo {
  /**
   * Tarball URL
   */
  tarball!: string;

  /**
   * Number of files in the tarball
   */
  @Field((type) => Int)
  fileCount?: number;

  /**
   * Total size in bytes of the unpacked files in the tarball
   */
  @Field((type) => Int)
  unpackedSize?: number;
}

@ObjectType()
export class ModuleConfig implements SubModuleConfig {
  /**
   * Module export name
   */
  moduleName!: string;

  /**
   * Entry
   */
  entry!: string;

  /**
   * Extract styles
   */
  @Field((type) => [String])
  styles?: string | string[];

  /**
   * Args schema
   */
  @Field((type) => JSONObjectResolver)
  args?: {};
}

@ObjectType()
export class SubModuleModel {
  /**
   * Unique package name
   */
  id!: string;

  /**
   * Sub-module package name
   */
  name!: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Versions
   */
  versions!: VersionModel[];

  /**
   * Tags
   */
  tags!: TagModel[];

  /**
   * README contents
   */
  readme?: string;

  /**
   * Name of the README file
   */
  readmeFilename?: string;
}

@ObjectType()
export class SubModuleManifestModel extends PickType(SubModuleModel, [
  'id',
  'name',
  'description',
  'readme',
  'readmeFilename',
] as const) {
  /**
   * Package version number
   */
  version!: string;

  /**
   * Package main entry
   */
  main?: string;

  /**
   * Package publisher
   */
  publisher!: AuhtorModel;

  /**
   * Dist info
   */
  dist!: DistInfo;

  /**
   * Sub-module configs
   */
  @Field((type) => JSONResolver)
  configuration?: ModuleConfig | Record<string, ModuleConfig>;

  /**
   * Publishing timestamp
   */
  createdAt!: Date;
}

@ObjectType()
export class PagedSubModuleItemModel extends PickType(SubModuleModel, ['name', 'description'] as const) {
  /**
   * Latest package version number
   */
  version!: string;

  /**
   * Package publisher
   */
  publisher!: AuhtorModel;

  /**
   * Publishing timestamp for the latest version
   */
  createdAt!: Date;
}

@ObjectType()
export class PagedSubModuleModel {
  /**
   * Paged data items
   */
  rows!: PagedSubModuleItemModel[];

  /**
   * Data total count
   */
  @Field((type) => Int)
  total!: number;
}

@ObjectType()
export class ObsSubModuleModel extends OmitType(SubModuleModel, ['id', 'tags'] as const) {
  // something else
}

@ObjectType()
export class ObsSubModuleManifestModel extends PickType(SubModuleModel, [
  'name',
  'description',
  'readme',
  'readmeFilename',
] as const) {
  /**
   * Package version number
   */
  version!: string;

  /**
   * Package main entry
   */
  main?: string;

  /**
   * Sub-module configs
   */
  @Field((type) => JSONObjectResolver)
  configuration?: ModuleConfig | Record<string, ModuleConfig>;
}

@ObjectType()
export class PagedObsSubModuleItemModel extends PickType(SubModuleModel, ['name', 'description'] as const) {
  /**
   * Latest package version number
   */
  version!: string;
}

@ObjectType()
export class PagedObsSubModuleModel {
  /**
   * Paged data items
   */
  rows!: PagedObsSubModuleItemModel[];

  /**
   * Next marker
   */
  nextMarker!: string;
}
