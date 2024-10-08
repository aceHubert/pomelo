import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { GraphQLScalarType } from 'graphql';

// export function PagedResponse<IItem>(TItemClass: ClassType<IItem>) {
//   @ObjectType(`Paged${TItemClass.name}`)
//   class PagedClass {
//     @Field((type) => [TItemClass])
//     rows!: IItem[];

//     @Field((type) => Int)
//     total!: number;
//   }
//   return PagedClass;
// }

/**
 * https://typegraphql.com/docs/generic-types.html
 */
export function PagedResponse<TItemsFieldValue>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  itemsFieldValue: Type<TItemsFieldValue> | GraphQLScalarType | String | Number | Boolean,
) {
  @ObjectType({ isAbstract: true, description: 'Paged model' })
  abstract class PagedClass {
    /**
     * Paged data items
     */
    @Field((type) => [itemsFieldValue])
    rows!: TItemsFieldValue[];

    /**
     * Date total count
     */
    @Field((type) => Int)
    total!: number;
  }
  return PagedClass;
}

@ObjectType({ isAbstract: true, description: 'Count model' })
export abstract class Count {
  /**
   * Count
   */
  @Field((type) => Int)
  count!: number;
}
