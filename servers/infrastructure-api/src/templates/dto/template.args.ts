import { Field, ArgsType, ID, Int, IntersectionType, OmitType, PickType } from '@nestjs/graphql';
import { TemplateStatus } from '@ace-pomelo/infrastructure-datasource';
import { PagedTemplateArgsValidator, CagetoryArgsValidator, TagArgsValidator } from './template-args.validator';

@ArgsType()
class PagedTemplateArgs extends PagedTemplateArgsValidator {
  /**
   * Fuzzy search by field "title"
   */
  keyword?: string;

  /**
   * Author id
   */
  @Field((type) => ID)
  author?: number;

  /**
   * Status
   */
  @Field((type) => TemplateStatus)
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
   * Page offset
   */
  @Field((type) => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Page size
   */
  @Field((type) => Int, { defaultValue: 20 })
  limit?: number;
}

@ArgsType()
class CategoryArgs extends CagetoryArgsValidator {
  /**
   * Category id
   */
  @Field((type) => ID)
  categoryId?: number;

  /**
   * Category name, warning: Can't set categoryId and categoryName in the same time
   */
  categoryName?: string;
}

@ArgsType()
class TagArgs extends TagArgsValidator {
  /**
   * Tag id
   */
  @Field((type) => ID)
  tagId?: number;

  /**
   * Tag name, warning: Can't set tagId and tagName in the same time
   */
  tagName?: string;
}

@ArgsType()
export class PagedBaseTemplateArgs extends IntersectionType(PagedTemplateArgs, CategoryArgs) {}

@ArgsType()
export class BaseTemplateOptionArgs extends PickType(PagedBaseTemplateArgs, [
  'type',
  'keyword',
  'author',
  'date',
  'categoryId',
  'categoryName',
] as const) {}

// #region Post

@ArgsType()
export class PagedPostTemplateArgs extends IntersectionType(
  OmitType(PagedTemplateArgs, ['type'] as const),
  IntersectionType(CategoryArgs, TagArgs),
) {}

@ArgsType()
export class ClientPagedPostTemplateArgs extends OmitType(PagedPostTemplateArgs, ['status'] as const) {}

@ArgsType()
export class PostTemplateOptionArgs extends PickType(PagedPostTemplateArgs, [
  'keyword',
  'author',
  'date',
  'categoryId',
  'categoryName',
  'tagId',
  'tagName',
] as const) {}

// #endregion

// #region Form

@ArgsType()
export class PagedFormTemplateArgs extends IntersectionType(
  OmitType(PagedTemplateArgs, ['type'] as const),
  CategoryArgs,
) {}

@ArgsType()
export class FormTemplateOptionArgs extends PickType(PagedFormTemplateArgs, [
  'keyword',
  'author',
  'date',
  'categoryId',
  'categoryName',
] as const) {}

// #endregion

// #region Page

@ArgsType()
export class PagedPageTemplateArgs extends IntersectionType(
  OmitType(PagedTemplateArgs, ['type'] as const),
  CategoryArgs,
) {}

@ArgsType()
export class PageTemplateOptionArgs extends PickType(PagedPageTemplateArgs, [
  'keyword',
  'author',
  'date',
  'categoryId',
  'categoryName',
] as const) {}

// #endregion
