import { Field, InputType, ID, Int } from '@nestjs/graphql';

@InputType({ description: 'New term relationship input' })
export class NewTermRelationshipInput {
  /**
   * Object id, Post, Link, etc...
   */
  @Field((type) => ID)
  objectId!: number;

  /**
   * Taxonomy id
   */
  @Field((type) => ID)
  termTaxonomyId!: number;

  /**
   * Order
   */
  @Field((type) => Int)
  order?: number;
}
