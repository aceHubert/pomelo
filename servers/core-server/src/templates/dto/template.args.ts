import { Field, ArgsType, Int, IntersectionType, OmitType, PickType } from '@nestjs/graphql';
import { TemplateStatus } from '@ace-pomelo/datasource';
import { PagedTemplateArgsValidator, CagetoryArgsValidator, TagArgsValidator } from './template-args.validator';

@ArgsType()
class PagedTemplateArgs extends PagedTemplateArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by field "title"' })
  keyword?: string;

  @Field({ nullable: true, description: 'Author id' })
  author?: string;

  @Field((type) => TemplateStatus, { nullable: true, description: 'Status' })
  status?: TemplateStatus;

  @Field({ description: 'Type (Required)' })
  type!: string;

  @Field({ description: 'Date，format: year(YYYY)/month(YYYYMM)/day(YYYYMMDD)' })
  date?: string;

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}

@ArgsType()
class CategoryArgs extends CagetoryArgsValidator {
  @Field((type) => Int, { nullable: true, description: 'Category id' })
  categoryId?: number;

  @Field({ nullable: true, description: `Category name (Can't set categoryId and categoryName in the same time.)` })
  categoryName?: string;
}

@ArgsType()
class TagArgs extends TagArgsValidator {
  @Field((type) => Int, { nullable: true, description: 'Tag id' })
  tagId?: number;

  @Field({ nullable: true, description: `Tag name (Can't set tagId and tagName in the same time.)` })
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

// -- Form --

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

// -- Page --

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

// -- Post --

@ArgsType()
export class PagedPostTemplateArgs extends IntersectionType(
  OmitType(PagedTemplateArgs, ['type'] as const),
  IntersectionType(CategoryArgs, TagArgs),
) {}

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
