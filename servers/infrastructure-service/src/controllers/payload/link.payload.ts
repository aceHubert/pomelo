import { LinkTarget, LinkVisible } from '@ace-pomelo/shared/server';
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsOptional, IsDefined, IsString, IsPositive, IsEnum } from 'class-validator';
import { PagedQueryPayload, RequestUserIdPayload } from './common.payload';

export class PagedLinkQueryPayload extends PagedQueryPayload {
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class NewLinkPayload extends RequestUserIdPayload {
  @IsDefined()
  @IsString()
  name!: string;

  @IsDefined()
  @IsString()
  url!: string;

  @IsDefined()
  @IsString()
  image!: string;

  @IsDefined()
  @IsString()
  description!: string;

  @IsDefined()
  @IsEnum(LinkTarget)
  target!: LinkTarget;

  /**
   * 是否可见, 默认可见
   */
  @IsOptional()
  @IsEnum(LinkVisible)
  visible?: LinkVisible;

  @IsOptional()
  @IsString()
  rel?: string;

  @IsOptional()
  @IsString()
  rss?: string;
}

export class UpdateLinkPayload extends IntersectionType(
  PartialType(
    PickType(NewLinkPayload, ['name', 'url', 'image', 'description', 'target', 'visible', 'rel', 'rss'] as const),
  ),
  RequestUserIdPayload,
) {
  @IsDefined()
  @IsPositive()
  id!: number;
}
