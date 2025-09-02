import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OmitType, PickType } from '@nestjs/mapped-types';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/shared/server';
import { PagedQueryPayload, RequestUserIdPayload } from './common.payload';
import { NewMetaPayload } from './meta.payload';

export class PagedTemplateQueryPayload extends PagedQueryPayload {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['title', 'name'])
  keywordField?: 'title' | 'name';

  @IsOptional()
  @IsPositive()
  author?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  taxonomies?: Array<
    | {
        /**
         * 类别id
         */
        id: number;

        /**
         * type
         * if type is "category", will compare with default category
         */
        type: string;
      }
    | {
        /**
         * 类别name
         */
        name: string;

        /**
         * type
         * if type is "category", will compare with default category
         */
        type: string;
      }
  >;
}

export class TemplateOptionQueryPayload extends OmitType(PagedTemplateQueryPayload, [
  'status',
  'offset',
  'limit',
] as const) {}

export class NewTemplatePayload extends RequestUserIdPayload {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  excerpt!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsEnum(TemplateCommentStatus)
  commentStatus?: TemplateCommentStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NewMetaPayload)
  metas?: NewMetaPayload[];
}

export class UpdateTemplatePayload extends OmitType(NewTemplatePayload, ['type', 'metas'] as const) {
  @IsPositive()
  id!: number;
}

export class NewFormTemplatePayload extends PickType(NewTemplatePayload, [
  'name',
  'title',
  'content',
  'status',
  'commentStatus',
  'metas',
  'requestUserId',
] as const) {}

export class UpdateFormTemplatePayload extends OmitType(NewFormTemplatePayload, ['metas'] as const) {
  @IsPositive()
  id!: number;
}

export class NewPageTemplatePayload extends PickType(NewTemplatePayload, [
  'name',
  'title',
  'content',
  'status',
  'commentStatus',
  'metas',
  'requestUserId',
] as const) {}

export class UpdatePageTemplatePayload extends OmitType(NewPageTemplatePayload, ['metas'] as const) {
  @IsPositive()
  id!: number;
}

export class NewPostTemplatePayload extends PickType(NewTemplatePayload, [
  'name',
  'status',
  'excerpt',
  'commentStatus',
  'metas',
  'requestUserId',
] as const) {
  @IsString()
  title!: string;

  @IsString()
  content!: string;
}

export class UpdatePostTemplatePayload extends OmitType(NewPostTemplatePayload, ['metas'] as const) {
  @IsPositive()
  id!: number;
}
