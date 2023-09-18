import { Field, ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { Template } from './base.model';

@ObjectType({ description: 'Page template model' })
export class PageTemplate extends PickType(Template, [
  'id',
  'name',
  'title',
  'author',
  'status',
  'commentStatus',
  'commentCount',
  'updatedAt',
  'createdAt',
] as const) {
  @Field({ description: 'Schema string JSON' })
  schema!: string;
}

@ObjectType({ description: 'Paged page template item model' })
export class PagedPageTemplateItem extends OmitType(PageTemplate, ['schema'] as const) {}

@ObjectType({ description: 'Paged page model' })
export class PagedPageTemplate extends PagedResponse(PagedPageTemplateItem) {
  // other fields
}

@ObjectType({ description: 'Page template option model' })
export class PageTemplateOption extends PickType(PageTemplate, ['id', 'name', 'title'] as const) {
  // other fields
}
