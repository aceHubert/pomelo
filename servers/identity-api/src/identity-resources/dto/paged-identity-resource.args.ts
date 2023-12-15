import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedIdentityResourceArgsValidator } from './paged-identity-resource-args.validator';

@ArgsType()
export class PagedIdentityResourceArgs extends PagedIdentityResourceArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by "keywordField" field' })
  keyword?: string;

  @Field((type) => String, {
    nullable: true,
    description: 'Field name for searching by keyword, allowed options: "name", "displayName", default: "name"',
  })
  keywordField?: 'name' | 'displayName';

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}
