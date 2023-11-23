import { InputType, PartialType, OmitType, PickType } from '@nestjs/graphql';
import {
  NewTemplateInput,
  NewFormTemplateInput,
  NewPageTemplateInput,
  NewPostTemplateInput,
} from './new-template.input';

@InputType({ description: 'Update template input' })
export class UpdateTemplateInput extends PartialType(
  PickType(NewTemplateInput, ['name', 'title', 'excerpt', 'content', 'status'] as const),
) {}

@InputType({ description: 'Update form input' })
export class UpdateFormTemplateInput extends PartialType(OmitType(NewFormTemplateInput, ['metas'] as const)) {}

@InputType({ description: 'Update page input' })
export class UpdatePageTemplateInput extends PartialType(OmitType(NewPageTemplateInput, ['metas'] as const)) {}

@InputType({ description: 'Update post input' })
export class UpdatePostTemplateInput extends PartialType(OmitType(NewPostTemplateInput, ['metas'] as const)) {}
