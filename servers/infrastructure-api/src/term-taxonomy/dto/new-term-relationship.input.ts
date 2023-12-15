import { Field, InputType, ID, Int } from '@nestjs/graphql';

@InputType({ description: 'New term relationship input' })
export class NewTermRelationshipInput {
  @Field((type) => ID, { description: 'Object id (Post, Link, etc...)' })
  objectId!: number;

  @Field((type) => ID, { description: 'Taxonomy id' })
  termTaxonomyId!: number;

  @Field((type) => Int, { nullable: true, description: 'Order (default: 0)' })
  order?: number;
}
