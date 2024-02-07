import moment, { MomentInput } from 'moment';
import { Type, Transform } from 'class-transformer';
import { ApiResponseProperty, PickType, OmitType } from '@nestjs/swagger';
import { SubModuleConfig } from '../interfaces/submodule-config.interface';

export class VersionModel {
  /**
   * Version
   */
  @ApiResponseProperty()
  version!: string;

  /**
   * Created time
   */
  @Type(() => Date)
  @Transform(({ value }) => moment(value).toISOString())
  @ApiResponseProperty()
  createdAt!: MomentInput;
}

export class TagModel {
  /**
   * Tag name
   */
  @ApiResponseProperty()
  name!: string;
  /**
   * Tag version
   */
  @ApiResponseProperty()
  version!: string;
}

export class AuhtorModel {
  /**
   * Author name
   */
  @ApiResponseProperty()
  name?: string;

  /**
   * Author username
   */
  @ApiResponseProperty()
  username?: string;

  /**
   * Author email
   */
  @ApiResponseProperty()
  email?: string;
}

export class DistInfo {
  /**
   * Tarball URL
   */
  @ApiResponseProperty()
  tarball!: string;

  /**
   * Number of files in the tarball
   */
  @ApiResponseProperty()
  fileCount?: number;

  /**
   * Total size in bytes of the unpacked files in the tarball
   */
  @ApiResponseProperty()
  unpackedSize?: number;
}

export class ModuleConfig implements SubModuleConfig {
  /**
   * Module export name
   */
  @ApiResponseProperty()
  moduleName!: string;

  /**
   * Entry
   */
  @ApiResponseProperty()
  entry!: string;

  /**
   * Extract styles
   */
  @ApiResponseProperty()
  styles?: string | string[];

  /**
   * Args schema
   */
  @ApiResponseProperty()
  props?: Record<string, unknown>;
}

export class SubModuleModelResp {
  /**
   * Unique package name
   */
  @ApiResponseProperty()
  id!: string;

  /**
   * Sub-module package name
   */
  @ApiResponseProperty()
  name!: string;

  /**
   * Description
   */
  @ApiResponseProperty()
  description?: string;

  /**
   * Versions
   */
  @ApiResponseProperty()
  versions!: VersionModel[];

  /**
   * Tags
   */
  @ApiResponseProperty()
  tags!: TagModel[];

  /**
   * README contents
   */
  @ApiResponseProperty()
  readme?: string;

  /**
   * Name of the README file
   * */
  @ApiResponseProperty()
  readmeFilename?: string;
}

export class SubModuleManifestModelResp extends PickType(SubModuleModelResp, [
  'id',
  'name',
  'description',
  'readme',
  'readmeFilename',
] as const) {
  /**
   * Package version number
   */
  @ApiResponseProperty()
  version!: string;

  /**
   * Package main entry
   */
  @ApiResponseProperty()
  main?: string;

  /**
   * Package publisher
   */
  @ApiResponseProperty()
  publisher!: AuhtorModel;

  /**
   * Dist info
   */
  @ApiResponseProperty()
  dist!: DistInfo;

  /**
   * Sub-module configs
   */
  @ApiResponseProperty()
  configuration?: ModuleConfig | Record<string, ModuleConfig>;

  /**
   * Publishing timestamp
   */
  @Type(() => Date)
  @Transform(({ value }) => moment(value).toISOString())
  @ApiResponseProperty()
  createdAt!: MomentInput;
}

export class PagedSubModuleItemModel extends PickType(SubModuleModelResp, ['name', 'description'] as const) {
  /**
   *  Latest package version number
   */
  @ApiResponseProperty()
  version!: string;

  /**
   * Package publisher
   */
  @ApiResponseProperty()
  publisher!: AuhtorModel;

  /**
   *  Publishing timestamp for the latest version
   */
  @Type(() => Date)
  @Transform(({ value }) => moment(value).toISOString())
  @ApiResponseProperty()
  createdAt!: MomentInput;
}

export class PagedSubModuleModelResp {
  /**
   * Paged data items
   */
  @ApiResponseProperty()
  rows!: PagedSubModuleItemModel[];

  /**
   * Data total count
   */
  @ApiResponseProperty()
  total!: number;
}

export class ObsSubModuleModelResp extends OmitType(SubModuleModelResp, ['id', 'tags'] as const) {
  // something else
}

export class ObsSubModuleManifestModelResp extends PickType(SubModuleModelResp, [
  'name',
  'description',
  'readme',
  'readmeFilename',
] as const) {
  /**
   * Package version number
   */
  @ApiResponseProperty()
  version!: string;

  /**
   * Package main entry
   */
  @ApiResponseProperty()
  main?: string;

  /**
   * Sub-module configs
   */
  @ApiResponseProperty()
  configuration?: ModuleConfig | Record<string, ModuleConfig>;
}

export class PagedObsSubModuleItemModel extends PickType(SubModuleModelResp, ['name', 'description'] as const) {
  /**
   *  Latest package version number
   */
  @ApiResponseProperty()
  version!: string;
}

export class PagedObsSubModuleModelResp {
  /**
   * Paged rows
   */
  @ApiResponseProperty({ type: [PagedObsSubModuleItemModel] })
  rows!: PagedObsSubModuleItemModel[];

  /**
   * Next marker
   */
  @ApiResponseProperty()
  nextMarker!: string;
}
