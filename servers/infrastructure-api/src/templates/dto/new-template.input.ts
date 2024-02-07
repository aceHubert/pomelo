import { Field, InputType, PickType } from '@nestjs/graphql';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewTemplateValidator } from './new-template.validator';

@InputType({ description: 'New template input' })
export class NewTemplateInput extends NewTemplateValidator {
  /**
   * Title
   */
  title?: string;

  /**
   * Identity name (generate by title if not provider)
   */
  name?: string;

  /**
   * Short description
   */
  excerpt?: string;

  /**
   * Content
   */
  content?: string;

  /**
   * Status
   */
  @Field((type) => TemplateStatus, { defaultValue: TemplateStatus.Publish })
  status?: TemplateStatus;

  /**
   * Type
   */
  type!: string;

  /**
   * Comment status
   */
  @Field((type) => TemplateCommentStatus, { defaultValue: TemplateCommentStatus.Closed })
  commentStatus?: TemplateCommentStatus;

  /**
   * New metas
   */
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
