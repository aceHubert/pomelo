import { PickType, PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class ListTermTaxonomyQueryPayload {
  @IsString()
  taxonomy!: string;

  @IsOptional()
  @IsPositive()
  parentId?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  group?: number;

  @IsOptional()
  @IsArray()
  @IsPositive({ each: true })
  excludes?: number[];
}

export class ListTermTaxonomyByObjectIdPayload {
  @IsPositive()
  objectId!: number;

  @IsString()
  taxonomy!: string;

  @IsOptional()
  @IsPositive()
  parentId?: number;

  @IsOptional()
  @IsPositive()
  group?: number;

  @IsOptional()
  @IsBoolean()
  desc?: boolean;
}

export class NewTermTaxonomyPayload {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  taxonomy!: string;

  @IsString()
  description!: string;

  @IsPositive()
  parentId!: number;

  @IsPositive()
  group!: number;

  @IsOptional()
  @IsPositive()
  objectId?: number;
}

export class NewTermRelationshipPayload {
  @IsPositive()
  objectId!: number;

  @IsPositive()
  termTaxonomyId!: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateTermTaxonomyPayload extends PartialType(
  PickType(NewTermTaxonomyPayload, ['name', 'slug', 'description', 'parentId', 'group'] as const),
) {
  @IsPositive()
  id!: number;
}
