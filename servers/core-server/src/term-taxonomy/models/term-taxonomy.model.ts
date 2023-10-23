import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { Meta } from '@/common/resolvers/models/meta.model';

@ObjectType({ description: 'Term taxonomy model' })
export class TermTaxonomy {
  @Field(() => ID, { description: 'Term Id' })
  id!: number;

  @Field({ description: 'Name' })
  name!: string;

  @Field({ description: 'Slug' })
  slug!: string;

  @Field({ description: 'Taxonomy name' })
  taxonomy!: string;

  @Field({ description: 'Taxonomy description' })
  description!: string;

  @Field((type) => ID, { defaultValue: 0, description: 'Parent taxonomy id (nested taxonomy)' })
  parentId!: number;

  @Field((type) => Int, { defaultValue: 0, description: 'Group' })
  group!: number;

  @Field((type) => Int, { defaultValue: 0, description: 'Count' })
  count!: number;
}

@ObjectType({ description: 'Term relationship model' })
export class TermRelationship {
  @Field(() => ID, { description: 'Object id (Post, Link, etc...)' })
  objectId!: number;

  @Field(() => ID, { description: 'Term taxonomy id' })
  termTaxonomyId!: number;

  @Field((type) => Int, { description: 'Order (default: 0)' })
  order!: number;
}

@ObjectType({ description: 'Term taxonomy meta model' })
export class TermTaxonomyMeta extends Meta {
  @Field((type) => ID, { description: 'Term Taxonomy Id' })
  termTaxonomyId!: number;
}
