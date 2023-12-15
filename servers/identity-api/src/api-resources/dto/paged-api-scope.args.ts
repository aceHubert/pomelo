import { Field, ArgsType, Int, ID } from '@nestjs/graphql';
import { PagedApiScopeArgsValidator } from './paged-api-scope-args.validator';

@ArgsType()
export class PagedApiScopeArgs extends PagedApiScopeArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by "keywordField" field' })
  keyword?: string;

  @Field((type) => String, {
    nullable: true,
    description: 'Field name for searching by keyword, allowed options: "name", "displayName", default: "name"',
  })
  keywordField?: 'name' | 'displayName';

  @Field((type) => ID, { nullable: true, description: 'Api resource id' })
  apiResourceId?: number;

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}
