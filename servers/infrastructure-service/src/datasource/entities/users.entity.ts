import { UserStatus } from '@ace-pomelo/shared/server';
import { Optional } from './types';

export interface UserAttributes {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile?: string;
  email?: string;
  url: string;
  status: UserStatus;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}
