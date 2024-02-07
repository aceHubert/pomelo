import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedIdentityResourceArgsValidator } from './paged-identity-resource-args.validator';

@ArgsType()
export class PagedIdentityResourceArgs extends PagedIdentityResourceArgsValidator {
  /**
   * Fuzzy search by "keywordField" field
   */
  keyword?: string;

  /**
   * Field name for searching by keyword, allowed options: "name", "displayName", default: "name"
   */
  @Field((type) => String, { defaultValue: 'name' })
  keywordField?: 'name' | 'displayName';

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
