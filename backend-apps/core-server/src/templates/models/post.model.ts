import { ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { Template } from './base.model';

@ObjectType({ description: 'Post template model' })
export class PostTemplate extends PickType(Template, [
  'id',
  'name',
  'title',
  'author',
  'content',
  'excerpt',
  'status',
  'commentStatus',
  'commentCount',
  'updatedAt',
  'createdAt',
] as const) {
  // something else
}

@ObjectType({ description: 'Paged post template item model' })
export class PagedPostTemplateItem extends OmitType(PostTemplate, ['content'] as const) {}

@ObjectType({ description: 'Paged post model' })
export class PagedPostTemplate extends PagedResponse(PagedPostTemplateItem) {
  // other fields
}

@ObjectType({ description: 'Post template option model' })
export class PostTemplateOption extends PickType(PostTemplate, ['id', 'name', 'title'] as const) {
  // other fields
}
