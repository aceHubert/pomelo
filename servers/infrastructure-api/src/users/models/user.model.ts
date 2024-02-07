import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserModel, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'User model' })
export class User implements UserModel {
  /**
   * User id
   */
  @Field((type) => ID)
  id!: number;

  /**
   * Login name
   */
  loginName!: string;

  /**
   * Nice name
   */
  niceName!: string;

  /**
   * Display name
   */
  displayName!: string;

  /**
   * Mobile
   */
  mobile!: string;

  /**
   * Email
   */
  email!: string;

  /**
   * Client url
   */
  url!: string;

  /**
   * Status
   */
  @Field((type) => UserStatus)
  status!: UserStatus;

  /**
   * Latest update time
   */
  updatedAt!: Date;

  /**
   * Creation time
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Paged user model' })
export class PagedUser extends PagedResponse(User) {}

@ObjectType({ description: 'User meta' })
export class UserMeta extends Meta {
  /**
   * User id
   */
  @Field((type) => ID)
  userId!: number;
}
