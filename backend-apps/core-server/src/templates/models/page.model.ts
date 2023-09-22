import { ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { Template } from './base.model';

@ObjectType({ description: 'Page template model' })
export class PageTemplate extends PickType(Template, [
  'id',
  'name',
  'title',
  'content',
  'author',
  'status',
  'commentStatus',
  'commentCount',
  'updatedAt',
  'createdAt',
] as const) {}

@ObjectType({ description: 'Paged page template item model' })
export class PagedPageTemplateItem extends OmitType(PageTemplate, ['content'] as const) {}

@ObjectType({ description: 'Paged page model' })
export class PagedPageTemplate extends PagedResponse(PagedPageTemplateItem) {}

@ObjectType({ description: 'Page template option model' })
export class PageTemplateOption extends PickType(PageTemplate, ['id', 'name', 'title'] as const) {}
