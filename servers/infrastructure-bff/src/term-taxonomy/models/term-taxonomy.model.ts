import { Field, ObjectType, ID, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { Meta } from '@/common/resolvers/models/meta.model';

@ObjectType({ description: 'Term taxonomy model' })
export class TermTaxonomy {
  /**
   * Term Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  parentId!: number;

  /**
   * Group
   */
  @Field(() => Int)
  group!: number;

  /**
   * Count
   */
  @Field(() => Int)
  count!: number;
}

@ObjectType({ description: 'Term relationship model' })
export class TermRelationship {
  /**
   * Object id, Post, Link, etc...
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  objectId!: number;

  /**
   * Term taxonomy id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  termTaxonomyId!: number;

  /**
   * Order
   */
  @Field(() => Int)
  order!: number;
}

@ObjectType({ description: 'Term taxonomy meta model' })
export class TermTaxonomyMeta extends Meta {
  /**
   * Term Taxonomy Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  termTaxonomyId!: number;
}
