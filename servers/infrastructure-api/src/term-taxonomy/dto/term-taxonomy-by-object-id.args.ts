import { Field, ArgsType, ID, Int } from '@nestjs/graphql';

/**
 * 查询协议关系参数
 */
@ArgsType()
export class TermTaxonomyByObjectIdArgs {
  @Field((type) => ID, { description: 'Object id (Post, Link, etc...)' })
  objectId!: number;

  @Field({ description: 'Taxonomy name' })
  taxonomy!: string;

  @Field((type) => ID, {
    nullable: true,
    description: 'Parent id (it will search for all if none value is provided, 0 is root parent id)',
  })
  parentId?: number;

  @Field((type) => Int, {
    nullable: true,
    description: 'Group(it will search for all if none value is provided)',
  })
  group?: number;

  @Field((type) => Boolean, { nullable: true, description: 'Sort（ default: asc）' })
  desc?: boolean;
}
