import { ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { Template } from './base.model';

@ObjectType({ description: 'Form template model' })
export class FormTemplate extends PickType(Template, [
  'id',
  'title',
  'content',
  'author',
  'status',
  'updatedAt',
  'createdAt',
] as const) {}

@ObjectType({ description: 'Paged form template item model' })
export class PagedFormTemplateItem extends OmitType(FormTemplate, ['content'] as const) {}

@ObjectType({ description: 'Paged form model' })
export class PagedFormTemplate extends PagedResponse(PagedFormTemplateItem) {}

@ObjectType({ description: 'Form template option model' })
export class FormTemplateOption extends PickType(FormTemplate, ['id', 'title'] as const) {}
