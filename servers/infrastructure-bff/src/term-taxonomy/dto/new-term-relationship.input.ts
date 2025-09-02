import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType({ description: 'New term relationship input' })
export class NewTermRelationshipInput {
  /**
   * Object id, Post, Link, etc...
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  objectId!: number;

  /**
   * Taxonomy id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  termTaxonomyId!: number;

  /**
   * Order
   */
  @Field(() => Int)
  order?: number;
}
