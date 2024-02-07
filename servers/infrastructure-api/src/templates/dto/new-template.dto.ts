import { PickType, ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { TemplateCommentStatus, TemplateStatus } from '@ace-pomelo/infrastructure-datasource';
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
   * Status
   * @default publish
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: TemplateStatus,
    required: false,
    default: TemplateStatus.Publish,
    description: 'Status',
  })
  status?: TemplateStatus;

  /**
   * Type
   */
  type!: string;

  /**
   * Comment status
   * @default closed
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: TemplateCommentStatus,
    required: false,
    default: TemplateCommentStatus.Closed,
    description: 'Comment status',
  })
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
