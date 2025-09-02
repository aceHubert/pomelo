import { Field, ArgsType, ID, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

/**
 * 查询协议关系参数
 */
@ArgsType()
export class TermTaxonomyByObjectIdArgs {
  /**
   * Object id, Post, Link, etc...
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  objectId!: number;

  /**
   * Taxonomy name
   */
  taxonomy!: string;

  /**
   * Parent id, it will search for all if none value is provided, 0 is root parent id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  parentId?: number;

  /**
   * Group, it will search for all if none value is provided, 0 is default group
   */
  @Field(() => Int)
  group?: number;

  /**
   * Sort, default: asc
   */
  desc?: boolean;
}
