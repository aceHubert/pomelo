import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDefined, IsArray, IsOptional, IsPositive, IsString, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { PagedQueryPayload, RequestUserIdPayload } from './common.payload';
import { NewMetaPayload } from './meta.payload';

export class PagedMediaQueryPayload extends PagedQueryPayload {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  extensions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  mimeTypes?: string[];
}

export class MediaMetaDataPayload {
  @IsDefined()
  @IsPositive()
  fileSize!: number;

  @IsOptional()
  @IsPositive()
  width?: number;

  @IsOptional()
  @IsPositive()
  height?: number;
}

export class NewMediaPayload extends RequestUserIdPayload {
  @IsDefined()
  @IsString()
  fileName!: string;

  @IsDefined()
  @IsString()
  originalFileName!: string;

  @IsDefined()
  @IsString()
  extension!: string;

  @IsDefined()
  @IsString()
  mimeType!: string;

  @IsDefined()
  @IsString()
  path!: string;

  @IsDefined()
  @Type(() => MediaMetaDataPayload)
  metaData!: MediaMetaDataPayload;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NewMetaPayload)
  metas?: NewMetaPayload[];
}

export class UpdateMediaPayload extends IntersectionType(
  PartialType(
    PickType(NewMediaPayload, ['fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'metaData'] as const),
  ),
  RequestUserIdPayload,
) {
  @IsDefined()
  @IsPositive()
  id!: number;
}
