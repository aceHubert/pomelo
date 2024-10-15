import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';
import { PagedUserArgsValidator } from './user-args.validator';

export class PagedUserQueryDto extends PagedUserArgsValidator {
  /**
   * Fuzzy search by field "loginName" or "displayName"
   */
  keyword?: string;

  /**
   * Status
   */
  @ApiProperty({
    enum: UserStatus,
    required: false,
    description: 'Status',
  })
  status?: UserStatus;

  /**
   * User Role
   */
  capabilities?: UserRole;

  /**
   * Paged offset
   */
  @ApiProperty({ minimum: 0, default: 0 })
  offset?: number;

  /**
   * Paged limit
   */
  @ApiProperty({ minimum: 5, maximum: 100, default: 20 })
  limit?: number;
}
