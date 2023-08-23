import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewTermTaxonomyMetaInput as INewTermTaxonomyMetaInput } from '@/sequelize-datasources/interfaces';

@InputType({ description: 'New term taxonomy meta input' })
export class NewTermTaxonomyMetaInput extends NewMetaInput implements INewTermTaxonomyMetaInput {
  @Field(() => ID, { description: 'Term taxonomy id' })
  termTaxonomyId!: number;
}
