import { CommentType } from '@ace-pomelo/shared/server';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { PagedQueryPayload, RequestUserIdPayload } from './common.payload';

export class PagedCommentQueryPayload extends PagedQueryPayload {
  /**
   * template id
   */
  @IsOptional()
  @IsPositive()
  templateId?: number;

  /**
   * parent id
   */
  @IsOptional()
  @IsPositive()
  parentId?: number;
}

export class NewCommentPayload extends RequestUserIdPayload {
  @IsDefined()
  @IsPositive()
  templateId!: number;

  @IsDefined()
  @IsString()
  author!: string;

  @IsDefined()
  @IsString()
  authorEmail?: string;

  @IsOptional()
  @IsString()
  authorUrl?: string;

  @IsOptional()
  @IsString()
  authorIp?: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  content!: string;

  @IsDefined()
  @IsBoolean()
  approved!: boolean;

  @IsDefined()
  @IsBoolean()
  edited!: boolean;

  @IsDefined()
  @IsEnum(CommentType)
  type!: CommentType;

  @IsOptional()
  @IsString()
  agent?: string;

  @IsOptional()
  @IsPositive()
  parentId!: number;
}

export class UpdateCommentPayload extends IntersectionType(
  PartialType(PickType(NewCommentPayload, ['content', 'approved', 'edited'] as const)),
  RequestUserIdPayload,
) {
  @IsDefined()
  @IsPositive()
  id!: number;
}
