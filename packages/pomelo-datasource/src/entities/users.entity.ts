import { Optional } from '../types';

/**
 * 用户状态
 */
export enum UserStatus {
  Disabled = 0,
  Enable = 1,
}

export interface UserAttributes {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile: string;
  email: string;
  url: string;
  status: UserStatus;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'status'> {}
