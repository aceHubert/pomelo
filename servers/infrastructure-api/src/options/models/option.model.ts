import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OptionAutoload, OptionModel } from '@ace-pomelo/infrastructure-datasource';

@ObjectType({ description: 'Option model' })
export class Option implements OptionModel {
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
