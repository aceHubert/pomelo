import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * 元数据实体模型
 */
@ObjectType({ isAbstract: true, description: 'Meta model' })
export abstract class Meta {
  /**
   * Meta Id
   */
  @Field((type) => ID)
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
