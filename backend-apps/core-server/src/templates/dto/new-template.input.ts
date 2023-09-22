import { Field, InputType, PickType } from '@nestjs/graphql';
import { TemplateStatus, TemplateCommentStatus } from '@pomelo/datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewTemplateValidator } from './new-template.validator';

@InputType({ description: 'New template input' })
export class NewTemplateInput extends NewTemplateValidator {
  @Field({ nullable: true, description: 'Title' })
  title?: string;

  @Field({ nullable: true, description: 'Identity name (generate by title if not provider)' })
  name?: string;

  @Field({ nullable: true, description: 'Short description' })
  excerpt?: string;

  @Field({ nullable: true, description: 'Content' })
  content?: string;

  @Field((type) => TemplateStatus, { nullable: true, description: 'Status' })
  status?: TemplateStatus;

  @Field({ description: 'Type' })
  type!: string;

  @Field((type) => TemplateCommentStatus, { nullable: true, description: 'Comment status' })
  commentStatus?: TemplateCommentStatus;

  @Field((type) => [NewMetaInput!], { nullable: true, description: 'New metas' })
  metas?: NewMetaInput[];
}

@InputType({ description: 'New form input' })
export class NewFormTemplateInput extends PickType(NewTemplateInput, [
  'title',
  'content',
  'status',
  'metas',
] as const) {}

@InputType({ description: 'New page input' })
export class NewPageTemplateInput extends PickType(NewTemplateInput, [
  'name',
  'title',
  'content',
  'status',
  'commentStatus',
  'metas',
] as const) {}

@InputType({ description: 'New post input' })
export class NewPostTemplateInput extends PickType(NewTemplateInput, [
  'title',
  'name',
  'excerpt',
  'content',
  'status',
  'commentStatus',
  'metas',
] as const) {}
