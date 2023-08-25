import { UserAttributes, UserCreationAttributes, UserStatus, UserRole } from '../../entities';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

/**
 * 用户实体（不包含登录密码）
 */
export interface UserModel extends Omit<UserAttributes, 'loginPwd'> {}

/**
 * 用户基本信息（不包含敏感信息字段）
 */
export interface UserSimpleModel extends Pick<UserAttributes, 'id' | 'displayName' | 'email'> {}

/**
 * 用户实体（包含角色）
 */
export interface UserWithRoleModel extends UserModel {
  userRole?: UserRole;
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
   * 根据 displayName 模糊查询
   */
  keyword?: string;
  status?: UserStatus;
  /**
   * 如果为none, 则表示在没有角色的用户下筛选；
   * 如果没有值，则表示在有角色的用户下筛选；
   */
  userRole?: UserRole | 'none';
}

/**
 * 用户分页返回实体
 */
export interface PagedUserModel extends Paged<UserWithRoleModel> {}

/**
 * 添加新用户实体
 */
export interface NewUserInput
  extends Pick<UserCreationAttributes, 'loginName' | 'loginPwd' | 'email' | 'mobile' | 'url'> {
  firstName?: string;
  lastName?: string;
  avator?: string;
  description?: string;
  userRole: UserRole;
  locale?: string;
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
  extends Partial<
    Pick<NewUserInput, 'loginPwd' | 'email' | 'mobile' | 'firstName' | 'lastName' | 'url' | 'avator' | 'description'>
  > {
  displayName: string;
  status?: UserStatus;
  nickName?: string;
  adminColor?: string;
  userRole?: UserRole | 'none';
  locale?: string | null;
}
