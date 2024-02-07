import { ApiProperty, ApiHideProperty, OmitType, PickType, IntersectionType } from '@nestjs/swagger';
import { TemplateStatus } from '@ace-pomelo/infrastructure-datasource';
import { PagedTemplateArgsValidator, CagetoryArgsValidator, TagArgsValidator } from './template-args.validator';

class PagedTemplateQueryDto extends PagedTemplateArgsValidator {
  /**
   * Fuzzy search by field "title"
   */
  keyword?: string;

  /**
   * Author id
   */
  author?: string;

  /**
   * Status
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: TemplateStatus,
    required: false,
    description: 'Status',
  })
  status?: TemplateStatus;

  /**
   * Type (Required)
   */
  type!: string;

  /**
   * Date，format: year(YYYY)/month(YYYYMM)/day(YYYYMMDD)
   */
  date?: string;

  /**
   * Paged offset
   */
  @ApiProperty({ minimum: 0, default: 0 })
  offset?: number;

  /**
   * Paged limit
   */
  @ApiProperty({ minimum: 5, maximum: 100, default: 20 })
  limit?: number;
}

class CategoryQueryDto extends CagetoryArgsValidator {
  /**
   * Category id
   */
  categoryId?: number;

  /**
   * Category name, warning: Can't set categoryId and categoryName in the same time
   */
  categoryName?: string;
}

class TagQueryDto extends TagArgsValidator {
  /**
   * Tag id
   */
  tagId?: number;

  /**
   * Tag name, warning: Can't set tagId and tagName in the same time
   */
  tagName?: string;
}

export class PagedBaseTemplateQueryDto extends IntersectionType(PagedTemplateQueryDto, CategoryQueryDto) {}

export class BaseTemplateOptionQueryDto extends PickType(PagedBaseTemplateQueryDto, [
  'type',
  'keyword',
  'author',
  'date',
  'categoryId',
  'categoryName',
] as const) {}

// -- Form --

export class PagedFormTemplateQueryDto extends IntersectionType(
  OmitType(PagedTemplateQueryDto, ['type'] as const),
  CategoryQueryDto,
) {}

export class FormTemplateOptionQueryDto extends PickType(PagedFormTemplateQueryDto, [
  'keyword',
  'author',
  'categoryId',
  'categoryName',
] as const) {}

// -- Page --

export class PagedPageTemplateQueryDto extends IntersectionType(
  OmitType(PagedTemplateQueryDto, ['type'] as const),
  CategoryQueryDto,
) {}

export class PageTemplateOptionQueryDto extends PickType(PagedPageTemplateQueryDto, [
  'keyword',
  'author',
  'categoryId',
  'categoryName',
] as const) {}

// -- Post --

export class PagedPostTemplateQueryDto extends IntersectionType(
  OmitType(PagedTemplateQueryDto, ['type'] as const),
  IntersectionType(TagQueryDto, CategoryQueryDto),
) {}

export class PostTemplateOptionQueryDto extends PickType(PagedPostTemplateQueryDto, [
  'keyword',
  'author',
  'categoryId',
  'categoryName',
  'tagId',
  'tagName',
] as const) {}
