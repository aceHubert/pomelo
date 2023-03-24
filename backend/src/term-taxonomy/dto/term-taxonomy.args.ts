import { Field, ArgsType, ID, Int, OmitType } from '@nestjs/graphql';
import { TermTaxonomyArgsValidator } from './term-taxonomy-args.validator';

@ArgsType()
export class TermTaxonomyArgs extends TermTaxonomyArgsValidator {
  @Field({ description: 'Taxonomy name' })
  taxonomy!: string;

  @Field({ nullable: true, description: 'Search keywork (fuzzy searching from term name)' })
  keyword?: string;

  @Field((type) => ID, {
    nullable: true,
    description: 'Parent id (it will search for all if none value is provided, 0 is root parent id)',
  })
  parentId?: number;

  @Field((type) => Int, { nullable: true, description: 'Group(it will search for all if none value is provided)' })
  group?: number;
}

@ArgsType()
export class CategoryTermTaxonomyArgs extends OmitType(TermTaxonomyArgs, ['taxonomy'] as const) {}

@ArgsType()
export class TagTermTaxonomyArgs extends OmitType(TermTaxonomyArgs, ['taxonomy', 'parentId'] as const) {}
