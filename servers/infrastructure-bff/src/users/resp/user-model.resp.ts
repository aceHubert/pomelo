import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { UserStatus } from '@ace-pomelo/shared/server';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class UserModelResp {
  /**
   * User id
   */
  @ApiResponseProperty()
  id!: number;

  /**
   * Login name
   */
  @ApiResponseProperty()
  loginName!: string;

  /**
   * Nice name
   */
  @ApiResponseProperty()
  niceName!: string;

  /**
   * Display name
   */
  @ApiResponseProperty()
  displayName!: string;

  /**
   * Mobile
   */
  @ApiResponseProperty()
  mobile!: string;

  /**
   * Email
   */
  @ApiResponseProperty()
  email!: string;

  /**
   * Client url
   */
  @ApiResponseProperty()
  url!: string;

  /**
   * Status
   */
  @ApiProperty({
    enum: UserStatus,
    readOnly: true,
    description: 'Status',
  })
  // @ApiResponseProperty()
  status!: UserStatus;

  /**
   * Latest update time
   */
  @ApiResponseProperty()
  updatedAt!: Date;

  /**
   * Creation time
   */
  @ApiResponseProperty()
  createdAt!: Date;
}

export class UserWithMetasModelResp extends UserModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<UserMetaModelResp>;
}

export class PagedUserResp extends PagedResponse(UserModelResp) {}

export class UserMetaModelResp extends MetaModelResp {
  /**
   * User id
   */
  @ApiResponseProperty()
  userId!: number;
}

export class SignInResultResp {
  /**
   * Verify success
   */
  @ApiResponseProperty()
  success!: boolean;

  /**
   * AccessToken, when success is true
   */
  @ApiResponseProperty()
  accessToken?: string;

  /**
   * TokenType, when success is true
   */
  @ApiResponseProperty()
  tokenType?: string;

  /**
   * Expires time, when success is true
   */
  @ApiResponseProperty()
  expiresAt?: number;

  /**
   * Faild message when success is false
   */
  @ApiResponseProperty()
  message?: string;
}
