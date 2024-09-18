import { ApiProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { NewOptionValidator } from './new-option.validator';

export class NewOptionDto extends NewOptionValidator {
  /**
   * Option name
   */
  optionName!: string;

  /**
   * Option value
   */
  optionValue!: string;

  /**
   * Is option load automatically in application start
   * @default no
   */
  @ApiProperty({
    enum: OptionAutoload,
    default: OptionAutoload.No,
    required: false,
    description: 'Is option load automatically in application start (default: no)',
  })
  autoload?: OptionAutoload = OptionAutoload.No;
}
