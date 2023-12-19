import { InputType, PickType } from '@nestjs/graphql';
import { NewOptionInput } from './new-option.input';

@InputType({ description: 'Update option input' })
export class UpdateOptionInput extends PickType(NewOptionInput, ['optionValue'] as const) {
  // something else
}
