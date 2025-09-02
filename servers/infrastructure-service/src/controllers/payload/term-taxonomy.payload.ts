import { PickType, PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ListTermTaxonomyQueryPayload {
  @IsString()
  taxonomy!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
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
  @IsInt()
  @Min(0)
  parentId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
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

  @IsInt()
  @Min(0)
  parentId!: number;

  @IsInt()
  @Min(0)
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
