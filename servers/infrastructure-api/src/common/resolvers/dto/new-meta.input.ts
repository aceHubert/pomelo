import { InputType } from '@nestjs/graphql';

/**
 * 元数据新建模型
 */
@InputType({ description: 'New meta input' })
export class NewMetaInput {
  /**
   * Meta key
   */
  metaKey!: string;

  /**
   * Meta value
   */
  metaValue?: string;
}
