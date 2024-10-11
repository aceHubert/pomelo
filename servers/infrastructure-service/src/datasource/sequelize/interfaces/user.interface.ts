import { Attributes, CreationAttributes } from 'sequelize';
import { UserStatus } from '@ace-pomelo/shared/server';
import { Users } from '../entities';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

/**
 * 用户实体（不包含登录密码）
 */
export interface UserModel extends Omit<Attributes<Users>, 'loginPwd'> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

/**
 * 用户实体（包含角色）
 */
export interface UserWithRoleModel extends UserModel {
  capabilities?: string;
}

/**
 * 用户元数据实体
 */
export interface UserMetaModel extends MetaModel {
  userId: number;
}

/**
 * 用户分页查询条件
 */
export interface PagedUserArgs extends PagedArgs {
  /**
   * 根据 loginName, displayName 模糊查询
   */
  keyword?: string;

  /**
   * 状态
   */
  status?: UserStatus;

  /**
   * 角色
   */
  capabilities?: string;
}

/**
 * 用户分页返回实体
 */
export interface PagedUserModel extends Paged<UserWithRoleModel> {}

/**
 * 添加新用户实体
 */
export interface NewUserInput extends CreationAttributes<Users> {
  firstName?: string;
  lastName?: string;
  avator?: string;
  description?: string;
  adminColor?: string;
  locale?: string;
  capabilities?: string;
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

/**
 * 添加新用户元数据实体
 */
export interface NewUserMetaInput extends NewMetaInput {
  userId: number;
}

/**
 * 修改用户模块
 */
export interface UpdateUserInput
  extends Partial<Pick<NewUserInput, 'firstName' | 'lastName' | 'url' | 'avator' | 'description' | 'adminColor'>> {
  status?: UserStatus;
  displayName?: string;
  nickName?: string;
  /**
   * 角色
   */
  capabilities?: string;
  /**
   * 用户语言
   */
  locale?: string;
}
