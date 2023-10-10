import { InputType, PartialType, PickType } from '@nestjs/graphql';
import { NewMediaInput } from './new-media.input';

@InputType()
export class UpdateMediaInput extends PartialType(
  PickType(NewMediaInput, ['fileName', 'originalFileName', 'extension', 'mimeType', 'path'] as const),
) {}
