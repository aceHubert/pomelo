import { Field, ArgsType, Int } from '@nestjs/graphql';
import { UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from '../enums/user-role.enum';
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
  @Field((type) => UserStatus)
  status?: UserStatus;

  /**
   * User Role, set null to filter none role users
   */
  @Field((type) => UserRole)
  capabilities?: UserRole;

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
