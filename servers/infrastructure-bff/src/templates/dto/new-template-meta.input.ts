import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New template meta input' })
export class NewTemplateMetaInput extends NewMetaInput {
  /**
   * Template Id
   */
  @Field(() => ID)
  templateId!: number;
}
