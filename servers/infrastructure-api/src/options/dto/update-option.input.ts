import { InputType, PickType, PartialType } from '@nestjs/graphql';
import { NewOptionInput } from './new-option.input';

@InputType({ description: 'Update option input' })
export class UpdateOptionInput extends PartialType(PickType(NewOptionInput, ['optionValue', 'autoload'] as const)) {
  // something else
}
