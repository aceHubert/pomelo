import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
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
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  parentId?: number;

  /**
   * Group
   */
  @Field(() => Int)
  group?: number;

  /**
   * Object id (it will add the relationship with currect term if provide a value)
   */
  @Field(() => ID)
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  objectId?: number;

  /**
   * New metas
   */
  metas?: NewMetaInput[];
}
