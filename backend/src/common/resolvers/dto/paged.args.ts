import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PagedArgs {
  @Field((type) => Int, { nullable: true, defaultValue: 0, description: 'Page offset' })
  offset!: number;

  @Field((type) => Int, { nullable: true, defaultValue: 20, description: 'Page size' })
  limit!: number;

  // get startIndex(): number {
  //   return this.offset;
  // }
  // get endIndex(): number {
  //   return this.offset + this.limit;
  // }
}
