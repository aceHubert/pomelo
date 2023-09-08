export interface Profile {
  sub: string;
  [claimKey: string]: any;
}

export class User {
  readonly access_token: string;
  readonly profile: Profile;
  expires_at?: number;

  constructor({ access_token, profile, expires_at }: { access_token: string; profile: Profile; expires_at?: number }) {
    this.access_token = access_token;
    this.profile = profile;
    this.expires_at = expires_at;
  }

  get expires_in() {
    if (this.expires_at === void 0) {
      return void 0;
    }
    const now = parseInt(String(Date.now() / 1000));
    return now < this.expires_at ? this.expires_at - now : 0;
  }

  set expires_in(value) {
    if (value !== void 0) {
      this.expires_at = Math.floor(value) + Date.now() / 1000;
    }
  }

  get expired() {
    const expires_in = this.expires_in;
    if (expires_in === void 0) {
      return void 0;
    }
    return expires_in <= 0;
  }
}

/**
 * 用户管理基类
 * TODO: 考虑一下用 interface 还是 abstract class
 */
export interface UserManager<SigninArgs = any, SignoutArgs = any, U extends User = User> {
  /**
   * 获取用户
   */
  getUser(): Promise<U | null>;
  /**
   * 触发跳转到授权页面, 并确保登录完成后跳转到当前页面
   */
  signin(args?: SigninArgs): Promise<void>;
  /**
   * 触发跳转到结束会话页
   */
  signout(args?: SignoutArgs): Promise<void>;
}
