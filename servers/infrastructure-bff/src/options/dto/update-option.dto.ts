import { PickType } from '@nestjs/swagger';
import { NewOptionDto } from './new-option.dto';

export class UpdateOptionDto extends PickType(NewOptionDto, ['optionValue'] as const) {
  // something else
}
