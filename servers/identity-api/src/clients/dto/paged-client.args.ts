import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedClientArgsValidator } from './paged-client-args.validator';

@ArgsType()
export class PagedClientArgs extends PagedClientArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by field "clientName"' })
  clientName?: string;

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}
