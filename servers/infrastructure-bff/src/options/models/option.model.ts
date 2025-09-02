import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { OptionAutoload } from '@ace-pomelo/shared/server';

@ObjectType({ description: 'Option model' })
export class Option {
  /**
   * Option id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
  @Field(() => OptionAutoload)
  autoload!: OptionAutoload;
}
