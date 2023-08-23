/**
 * 用户状态
 */
export enum UserStatus {
  Disabled = 0,
  Enable = 1,
}

/**
 * 用户角色
 */
export enum UserRole {
  User = 'user',
  Administrator = 'administrator',
}

export interface UserAttributes {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile: string | null;
  email: string;
  url: string | null;
  status: UserStatus;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'niceName' | 'displayName' | 'mobile' | 'url' | 'status'> {}
