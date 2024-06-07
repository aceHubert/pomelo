import { Optional } from '../types';

export interface UserAttributes {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile?: string;
  email?: string;
  url: string;
  status: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}
