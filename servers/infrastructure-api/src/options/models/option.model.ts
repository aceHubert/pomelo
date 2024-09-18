import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/shared/server';

@ObjectType({ description: 'Option model' })
export class Option {
  /**
   * Option id
   */
  @Field(() => ID)
  id!: number;

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
   */
  @Field((type) => OptionAutoload)
  autoload!: OptionAutoload;
}
