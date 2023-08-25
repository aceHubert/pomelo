import { Field, InputType, ID } from '@nestjs/graphql';
import { NewTermTaxonomyMetaInput as INewTermTaxonomyMetaInput } from '@pomelo/datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New term taxonomy meta input' })
export class NewTermTaxonomyMetaInput extends NewMetaInput implements INewTermTaxonomyMetaInput {
  @Field(() => ID, { description: 'Term taxonomy id' })
  termTaxonomyId!: number;
}
