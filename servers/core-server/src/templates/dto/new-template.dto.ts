import { PickType } from '@nestjs/swagger';
import { TemplateCommentStatus, TemplateStatus } from '@ace-pomelo/datasource';
import { NewTemplateValidator } from './new-template.validator';

export class NewTemplateDto extends NewTemplateValidator {
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
   * Status, Default: Draft
   */
  status?: TemplateStatus;

  /**
   * Type
   */
  type!: string;

  /**
   * Comment status
   * @default closed
   */
  commentStatus?: TemplateCommentStatus;
}

export class NewFormTemplateDto extends PickType(NewTemplateDto, ['title', 'content', 'status'] as const) {}

export class NewPageTemplateDto extends PickType(NewTemplateDto, [
  'name',
  'title',
  'content',
  'status',
  'commentStatus',
] as const) {}

export class NewPostTemplateDto extends PickType(NewTemplateDto, [
  'name',
  'title',
  'excerpt',
  'content',
  'status',
  'commentStatus',
] as const) {}
