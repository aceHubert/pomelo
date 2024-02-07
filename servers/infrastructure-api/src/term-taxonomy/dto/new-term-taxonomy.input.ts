import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewTermTaxonomyValidator } from './new-term-taxonomy.validator';

@InputType({ description: 'New term taxonomy input' })
export class NewTermTaxonomyInput extends NewTermTaxonomyValidator {
  /**
   * Term name
   */
  name!: string;

  /**
   * Term slug
   */
  slug?: string;

  /**
   * Taxonomy name
   */
  taxonomy!: string;

  /**
   * Description for taxonomy
   */
  description!: string;

  /**
   * Parent(taxonomy) id
   */
  @Field((type) => ID, { defaultValue: 0 })
  parentId?: number;

  /**
   * Group
   */
  @Field((type) => Int, { defaultValue: 0 })
  group?: number;

  /**
   * Object id (it will add the relationship with currect term if provide a value)
   */
  @Field((type) => ID)
  objectId?: number;

  /**
   * New metas
   */
  metas?: NewMetaInput[];
}
