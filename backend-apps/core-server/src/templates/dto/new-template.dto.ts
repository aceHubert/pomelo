import { IsDefined, IsString, IsJSON } from 'class-validator';
import { PickType } from '@nestjs/swagger';
import { TemplateStatus } from '@/orm-entities/interfaces';
import { NewTemplateValidator } from './new-template.validator';

export class NewTemplateDto extends NewTemplateValidator {
  /**
   * Title
   */
  title!: string;

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
  content!: string;

  /**
   * Status, Default: Draft
   */
  status?: TemplateStatus;

  /**
   * Type
   */
  type!: string;
}

export class NewFormTemplateDto extends PickType(NewTemplateDto, ['title', 'name', 'status'] as const) {
  /**
   * Schema
   */
  @IsDefined()
  @IsString()
  @IsJSON({ message: 'field $property must be a JSON string' })
  schema!: string;
}

export class NewPageTemplateDto extends PickType(NewTemplateDto, ['title', 'name', 'status'] as const) {
  /**
   * Schema
   */
  @IsDefined()
  @IsString()
  @IsJSON({ message: 'field $property must be a JSON string' })
  schema!: string;
}

export class NewPostTemplateDto extends PickType(NewTemplateDto, [
  'title',
  'name',
  'excerpt',
  'content',
  'status',
] as const) {
  // something else
}
