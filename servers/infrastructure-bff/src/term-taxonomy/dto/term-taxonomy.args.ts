import { Field, ArgsType, ID, Int, OmitType } from '@nestjs/graphql';
import { TermTaxonomyArgsValidator } from './term-taxonomy-args.validator';

@ArgsType()
export class TermTaxonomyArgs extends TermTaxonomyArgsValidator {
  /**
   * Taxonomy name
   */
  taxonomy!: string;

  /**
   * Fuzzy searching from term name
   */
  keyword?: string;

  /**
   * Parent id, it will search for all if none value is provided, 0 is root parent id
   */
  @Field((type) => ID)
  parentId?: number;

  /**
   * Group, it will search for all if none value is provided, 0 is default group
   */
  @Field((type) => Int)
  group?: number;

  /**
   * Exclude term ids
   */
  @Field((type) => [Int])
  exclude?: number[];
}

@ArgsType()
export class CategoryTermTaxonomyArgs extends OmitType(TermTaxonomyArgs, ['taxonomy'] as const) {
  /**
   * With default category
   */
  @Field({ defaultValue: false })
  includeDefault?: boolean;
}

@ArgsType()
export class TagTermTaxonomyArgs extends OmitType(TermTaxonomyArgs, ['taxonomy', 'parentId'] as const) {}
