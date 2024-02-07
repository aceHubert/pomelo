import { Field, ArgsType, Int, ID } from '@nestjs/graphql';
import { PagedApiScopeArgsValidator } from './paged-api-scope-args.validator';

@ArgsType()
export class PagedApiScopeArgs extends PagedApiScopeArgsValidator {
  /**
   * Fuzzy search by "keywordField" field
   */
  keyword?: string;

  /**
   * Field name for searching by keyword, allowed options: "name", "displayName"
   */
  @Field((type) => String, { defaultValue: 'name' })
  keywordField?: 'name' | 'displayName';

  /**
   * Api resource id
   */
  @Field((type) => ID)
  apiResourceId?: number;

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
