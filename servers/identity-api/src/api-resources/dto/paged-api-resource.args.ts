import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedApiResourceArgsValidator } from './paged-api-resource-args.validator';

@ArgsType()
export class PagedApiResourceArgs extends PagedApiResourceArgsValidator {
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
   * Page offset, Default: 0
   */
  @Field((type) => Int)
  offset?: number;

  /**
   * Page size, Default: 20
   */
  @Field((type) => Int)
  limit?: number;
}
