import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { Meta } from '@/common/resolvers/models/meta.model';

@ObjectType({ description: 'Term taxonomy model' })
export class TermTaxonomy {
  /**
   * Term Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Name
   */
  name!: string;

  /**
   * Slug
   */
  slug!: string;

  /**
   * Taxonomy name
   */
  taxonomy!: string;

  /**
   * Taxonomy description
   */
  description!: string;

  /**
   * Parent taxonomy id (nested taxonomy)
   */
  @Field((type) => ID)
  parentId!: number;

  /**
   * Group
   */
  @Field((type) => Int)
  group!: number;

  /**
   * Count
   */
  @Field((type) => Int)
  count!: number;
}

@ObjectType({ description: 'Term relationship model' })
export class TermRelationship {
  /**
   * Object id, Post, Link, etc...
   */
  @Field(() => ID)
  objectId!: number;

  /**
   * Term taxonomy id
   */
  @Field(() => ID)
  termTaxonomyId!: number;

  /**
   * Order
   */
  @Field((type) => Int)
  order!: number;
}

@ObjectType({ description: 'Term taxonomy meta model' })
export class TermTaxonomyMeta extends Meta {
  /**
   * Term Taxonomy Id
   */
  @Field((type) => ID)
  termTaxonomyId!: number;
}
