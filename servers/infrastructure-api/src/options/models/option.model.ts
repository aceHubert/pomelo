import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';

@ObjectType({ description: 'Option model' })
export class Option {
  @Field(() => ID, { description: 'Option id' })
  id!: number;

  @Field({ description: 'Option name' })
  optionName!: string;

  @Field({ description: 'Option value' })
  optionValue!: string;

  @Field((type) => OptionAutoload, { description: 'Is option load automatically in application start' })
  autoload!: OptionAutoload;
}
