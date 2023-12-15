import { Field, ArgsType, Int } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { PagedUserArgsValidator } from './user-args.validator';

@ArgsType()
export class PagedUserArgs extends PagedUserArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by field "loginName" or "displayName"' })
  keyword?: string;

  @Field((type) => UserStatus, { nullable: true, description: 'Status' })
  status?: UserStatus;

  @Field((type) => UserRole, { nullable: true, description: 'User Role, set null to filter none role users' })
  capabilities?: UserRole;

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}
