import { Field, InputType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New template meta input' })
export class NewTemplateMetaInput extends NewMetaInput {
  /**
   * Template Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  templateId!: number;
}
