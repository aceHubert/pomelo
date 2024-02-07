import { Field, InputType, ID } from '@nestjs/graphql';
import { NewTermTaxonomyMetaInput as INewTermTaxonomyMetaInput } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New term taxonomy meta input' })
export class NewTermTaxonomyMetaInput extends NewMetaInput implements INewTermTaxonomyMetaInput {
  /**
   * Term taxonomy id
   */
  @Field(() => ID)
  termTaxonomyId!: number;
}
