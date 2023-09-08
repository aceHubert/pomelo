import { MomentInput } from 'moment';
import { Field, Int, ObjectType, PickType, OmitType } from '@nestjs/graphql';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { GraphQLMomentISODateTime } from '@/common/graphql/moment-iso-date.scalar';
import { SubModuleConfig } from '../interfaces/submodule-config.interface';

@ObjectType()
export class VersionModel {
  @Field({ description: 'Version' })
  version!: string;

  @Field((type) => GraphQLMomentISODateTime, { description: 'Created time' })
  createdAt!: MomentInput;
}

@ObjectType()
export class TagModel {
  @Field({ description: 'Tag name' })
  name!: string;

  @Field({ description: 'Tag version' })
  version!: string;
}

@ObjectType()
export class AuhtorModel {
  @Field({ nullable: true, description: 'Author name' })
  name?: string;

  @Field({ nullable: true, description: 'Author username' })
  username?: string;

  @Field({ nullable: true, description: 'Author email' })
  email?: string;
}

@ObjectType()
export class DistInfo {
  @Field({ description: 'Tarball URL' })
  tarball!: string;

  @Field((type) => Int, { nullable: true, description: 'Number of files in the tarball' })
  fileCount?: number;

  @Field((type) => Int, { nullable: true, description: 'Total size in bytes of the unpacked files in the tarball' })
  unpackedSize?: number;
}

@ObjectType()
export class ModuleConfig implements SubModuleConfig {
  @Field({ description: 'Module export name' })
  moduleName!: string;

  @Field({ description: 'Entry' })
  entry!: string;

  @Field((type) => [String], { nullable: true, description: 'Extract styles' })
  styles?: string | string[];

  @Field((type) => GraphQLJSONObject, { nullable: true, description: 'Args schema' })
  args?: {};
}

@ObjectType()
export class SubModuleModel {
  @Field({ description: 'Unique package name' })
  id!: string;

  @Field({ description: 'Sub-module package name' })
  name!: string;

  @Field({ nullable: true, description: 'Description' })
  description?: string;

  @Field((type) => [VersionModel], { description: 'Versions' })
  versions!: VersionModel[];

  @Field((type) => [TagModel], { description: 'Tags' })
  tags!: TagModel[];

  @Field({ nullable: true, description: 'README contents' })
  readme?: string;

  @Field({ nullable: true, description: 'Name of the README file' })
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
  @Field({ description: 'Package version number' })
  version!: string;

  @Field({ nullable: true, description: 'Package main entry' })
  main?: string;

  @Field((type) => AuhtorModel, { description: 'Package publisher' })
  publisher!: AuhtorModel;

  @Field((type) => DistInfo, { description: 'Dist info' })
  dist!: DistInfo;

  @Field((type) => GraphQLJSON, { nullable: true, description: 'Sub-module configs' })
  configuration?: ModuleConfig | Record<string, ModuleConfig>;

  @Field((type) => GraphQLMomentISODateTime, { description: 'Publishing timestamp' })
  createdAt!: MomentInput;
}

@ObjectType()
export class PagedSubModuleItemModel extends PickType(SubModuleModel, ['name', 'description'] as const) {
  @Field({ description: 'Latest package version number' })
  version!: string;

  @Field({ description: 'Package publisher' })
  publisher!: AuhtorModel;

  @Field((type) => GraphQLMomentISODateTime, { description: 'Publishing timestamp for the latest version' })
  createdAt!: MomentInput;
}

@ObjectType()
export class PagedSubModuleModel extends PagedResponse(PagedSubModuleItemModel) {
  // something else
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
  @Field({ description: 'Package version number' })
  version!: string;

  @Field({ nullable: true, description: 'Package main entry' })
  main?: string;

  @Field((type) => GraphQLJSON, { nullable: true, description: 'Sub-module configs' })
  configuration?: ModuleConfig | Record<string, ModuleConfig>;
}

@ObjectType()
export class PagedObsSubModuleItemModel extends PickType(SubModuleModel, ['name', 'description'] as const) {
  @Field({ description: 'Latest package version number' })
  version!: string;
}

@ObjectType()
export class PagedObsSubModuleModel {
  /**
   * Paged rows
   */
  @Field((type) => [PagedObsSubModuleItemModel], { description: 'Paged data items' })
  rows!: PagedObsSubModuleItemModel[];

  @Field({ description: 'Next marker' })
  nextMarker!: string;
}
