import { Field, ArgsType, Int } from '@nestjs/graphql';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';
import { PagedUserArgsValidator } from './user-args.validator';

@ArgsType()
export class PagedUserArgs extends PagedUserArgsValidator {
  /**
   * Fuzzy search by field "loginName" or "displayName"
   */
  keyword?: string;

  /**
   * Status
   */
  @Field(() => UserStatus)
  status?: UserStatus;

  /**
   * User Role
   */
  @Field(() => UserRole)
  capabilities?: UserRole;

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
}
