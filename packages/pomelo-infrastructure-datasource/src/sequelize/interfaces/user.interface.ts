import { Attributes, CreationAttributes } from 'sequelize';
import Users from '../entities/users.entity';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

/**
 * 用户状态
 */
export enum UserStatus {
  Disabled = 0,
  Enabled = 1,
}

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
   * 区分 null 和 undefined
   * null表示搜索没有用户角色的；
   * undefined 表示不限制用户角色
   */
  capabilities?: string | null;
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
   * 区分 null 和 undefined
   * null 表示重置为无任何用户角色；
   * undefined 表示不修改用户角色
   */
  capabilities?: string | null;
  /**
   * 区分 null 和 undefined
   * none 表示重置为使用站点默认语言
   * undefined 表示不修改用户语言
   */
  locale?: string | null;
}
