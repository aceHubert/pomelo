import { ApiProperty, ApiHideProperty, ApiResponseProperty } from '@nestjs/swagger';
import { UserModel, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class UserModelResp implements UserModel {
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
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
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
