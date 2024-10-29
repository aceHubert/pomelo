import { UserStatus } from '@ace-pomelo/shared/server';

export interface UserModel {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile?: string;
  email?: string;
  url: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
