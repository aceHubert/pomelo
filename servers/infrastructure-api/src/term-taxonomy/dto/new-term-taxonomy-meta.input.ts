import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New term taxonomy meta input' })
export class NewTermTaxonomyMetaInput extends NewMetaInput {
  /**
   * Term taxonomy id
   */
  @Field(() => ID)
  termTaxonomyId!: number;
}
