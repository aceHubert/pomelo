import { Field, InputType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { NewOptionValidator } from './new-option.validator';

@InputType({ description: 'New option inpupt' })
export class NewOptionInput extends NewOptionValidator {
  /**
   * Name
   */
  optionName!: string;

  /**
   * Value
   */
  optionValue!: string;

  /**
   * Is option load automatically in application start
   */
  @Field(() => OptionAutoload)
  autoload?: OptionAutoload;
}
