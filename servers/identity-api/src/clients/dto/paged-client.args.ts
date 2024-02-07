import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedClientArgsValidator } from './paged-client-args.validator';

@ArgsType()
export class PagedClientArgs extends PagedClientArgsValidator {
  /**
   * Fuzzy search by field "clientName"
   */
  clientName?: string;

  /**
   * Page offset
   */
  @Field((type) => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Page size
   */
  @Field((type) => Int, { defaultValue: 20 })
  limit?: number;
}
