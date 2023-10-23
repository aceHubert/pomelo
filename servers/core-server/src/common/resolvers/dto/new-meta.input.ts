import { InputType, Field } from '@nestjs/graphql';

/**
 * 元数据新建模型
 */
@InputType({ description: 'New meta input' })
export class NewMetaInput {
  @Field({ description: 'Meta key' })
  metaKey!: string;

  @Field((type) => String, { nullable: true, description: 'Meta value' })
  metaValue?: string;
}
