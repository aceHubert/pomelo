import { ApiResponseProperty } from '@nestjs/swagger';
import { UserAttributes, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class UserModelResp implements Omit<UserAttributes, 'loginPwd'> {
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
  @ApiResponseProperty()
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
