import { PickType, PartialType } from '@nestjs/swagger';
import { NewOptionDto } from './new-option.dto';

export class UpdateOptionDto extends PartialType(PickType(NewOptionDto, ['optionValue', 'autoload'] as const)) {
  // something else
}
