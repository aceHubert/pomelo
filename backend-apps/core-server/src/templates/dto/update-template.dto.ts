import { PartialType, PickType } from '@nestjs/swagger';
import { NewTemplateDto, NewFormTemplateDto, NewPageTemplateDto, NewPostTemplateDto } from './new-template.dto';

export class UpdateTemplateDto extends PartialType(
  PickType(NewTemplateDto, ['title', 'excerpt', 'content', 'status'] as const),
) {}

export class UpdateFormTemplateDto extends PartialType(NewFormTemplateDto) {}

export class UpdatePageTemplateDto extends PartialType(NewPageTemplateDto) {}

export class UpdatePostTemplateDto extends PartialType(NewPostTemplateDto) {}
