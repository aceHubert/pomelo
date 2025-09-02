import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

/**
 * 元数据实体模型
 */
@ObjectType({ isAbstract: true, description: 'Meta model' })
export abstract class Meta {
  /**
   * Meta Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Meta key
   */
  metaKey!: string;

  /**
   * Meta value
   */
  metaValue?: string;
}
