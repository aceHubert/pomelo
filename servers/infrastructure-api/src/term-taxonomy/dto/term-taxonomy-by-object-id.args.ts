import { Field, ArgsType, ID, Int } from '@nestjs/graphql';

/**
 * 查询协议关系参数
 */
@ArgsType()
export class TermTaxonomyByObjectIdArgs {
  /**
   * Object id, Post, Link, etc...
   */
  @Field((type) => ID)
  objectId!: number;

  /**
   * Taxonomy name
   */
  taxonomy!: string;

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
   * Sort, default: asc
   */
  desc?: boolean;
}
