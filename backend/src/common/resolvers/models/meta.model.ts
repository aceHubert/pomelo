import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * 元数据实体模型
 */
@ObjectType({ isAbstract: true, description: 'Meta model' })
export abstract class Meta {
  @Field((type) => ID, { description: 'Meta Id' })
  id!: number;

  @Field({ description: 'Meta key' })
  metaKey!: string;

  @Field((type) => String, { nullable: true, description: 'Meta value' })
  metaValue?: string;
}
