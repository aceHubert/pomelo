import { Field, InputType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/datasource';
import { NewOptionValidator } from './new-option.validator';

@InputType({ description: 'New option inpupt' })
export class NewOptionInput extends NewOptionValidator {
  @Field({ description: 'Name' })
  optionName!: string;

  @Field({ description: 'Value' })
  optionValue!: string;

  @Field((type) => OptionAutoload, {
    nullable: true,
    defaultValue: OptionAutoload.No,
    description: 'Is option load automatically in application start (default: no)',
  })
  autoload!: OptionAutoload;
}
