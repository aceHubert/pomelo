import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { DateTimeISOResolver } from 'graphql-scalars';
import { UserStatus } from '@ace-pomelo/shared/server';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'User model' })
export class User {
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
  mobile?: string;

  /**
   * Email
   */
  email?: string;

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
  @Field((type) => DateTimeISOResolver)
  updatedAt!: Date;

  /**
   * Creation time
   */
  @Field((type) => DateTimeISOResolver)
  createdAt!: Date;
}

/**
 * 非敏感用户信息
 */
@ObjectType({ description: 'User simple model' })
export class SimpleUser extends PickType(User, ['id', 'loginName', 'niceName', 'displayName', 'url'] as const) {}

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

@ObjectType({ description: 'Sign in result' })
export class SignInResult {
  /**
   * Verify success
   */
  @Field((type) => Boolean)
  success!: boolean;

  /**
   * Token when success is true
   */
  @Field({ nullable: true })
  accessToken?: string;

  /**
   * Token type when success is true
   */
  @Field({ nullable: true })
  tokenType?: string;

  /**
   * Expires time, when success is true
   */
  @Field({ nullable: true })
  expiresAt?: number;

  /**
   * Faild message when success is false
   */
  @Field({ nullable: true })
  message?: string;
}
