export interface IUser {
  access_token: string;
  token_type: string;
  /** The claims represented by a combination of the id_token and the user info endpoint */
  get profile(): {
    sub: string;
    [key: string]: any;
  };

  /** Calculated value indicating if the access token is expired */
  get expired(): boolean | undefined;
}

export interface ISigninArgs {
  /** If true, the signin request will not be interactive */
  noInteractive?: boolean;
  /** The URL to redirect to after the signin request */
  redirect_uri?: string;
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISignoutArgs {
  /** The URL to redirect to after the signin request */
  redirect_uri?: string;
  [key: string]: any;
}

/**
 * 用户管理基类
 */
export abstract class UserManager<
  SigninArgs extends ISigninArgs = ISigninArgs,
  SignoutArgs extends ISignoutArgs = ISignoutArgs,
  User extends IUser = IUser,
> {
  /**
   * 获取用户
   */
  abstract getUser(): Promise<User | null>;
  /**
   * 移除用户
   */
  abstract removeUser(): Promise<void>;
  /**
   * 修改密码
   */
  abstract modifyPassword(): Promise<void>;
  /**
   * 触发跳转到授权页面, 并确保登录完成后跳转到当前页面
   */
  abstract signin(args?: SigninArgs): Promise<void>;
  /**
   * 触发跳转到结束会话页
   */
  abstract signout(args?: SignoutArgs): Promise<void>;
}
