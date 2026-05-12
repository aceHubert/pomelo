import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { OptionPresetKeys } from '@ace-pomelo/shared/server';

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
}

@ObjectType({ description: 'Option value model' })
export class OptionValue {
  /**
   * Option preset key
   */
  @Field(() => String)
  key!: OptionPresetKeys;

  /**
   * Option value
   */
  @Field(() => String, { nullable: true })
  value?: string;

  /**
   * Is option value set
   */
  @Field(() => Boolean)
  isSet!: boolean;

  /**
   * Is default value used
   */
  @Field(() => Boolean)
  useDefault!: boolean;

  /**
   * Option value message
   */
  @Field(() => String, { nullable: true })
  message?: string;
}
