import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PagedArgs {
  /**
   * Page offset
   */
  @Field(() => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Page size
   */
  @Field(() => Int, { defaultValue: 20 })
  limit?: number;

  // get startIndex(): number {
  //   return this.offset;
  // }
  // get endIndex(): number {
  //   return this.offset + this.limit;
  // }
}
