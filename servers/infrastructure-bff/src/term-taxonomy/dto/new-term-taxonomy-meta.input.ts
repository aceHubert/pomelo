import { Field, InputType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New term taxonomy meta input' })
export class NewTermTaxonomyMetaInput extends NewMetaInput {
  /**
   * Term taxonomy id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  termTaxonomyId!: number;
}
