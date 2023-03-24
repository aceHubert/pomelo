export interface Profile {
  sub: string;
  [claimKey: string]: any;
}

export interface UserSettings {
  id_token: string;
  session_state: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  scope: string;
  profile: Profile;
  expires_at: number;
  state: any;
}

export class User {
  id_token: string;
  session_state?: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
  profile: Profile;
  expires_at: number;
  state: any;

  constructor(user: UserSettings) {
    this.id_token = user.id_token;
    this.session_state = user.session_state;
    this.access_token = user.access_token;
    this.refresh_token = user.refresh_token;
    this.token_type = user.token_type;
    this.scope = user.scope;
    this.profile = user.profile;
    this.expires_at = user.expires_at;
    this.state = user.state;
  }

  get expires_in() {
    const now = parseInt(String(Date.now() / 1000));
    return now < this.expires_at ? this.expires_at - now : 0;
  }

  get expired() {
    const now = parseInt(String(Date.now() / 1000));
    return now > this.expires_at;
  }

  get scopes() {
    return this.scope.split(' ').map((item) => item.trim());
  }
}

export interface UserManager {
  getUser(): Promise<User | null>;
  signIn(noInteractive?: boolean): Promise<void>;
  signinSilent(): Promise<User | null>;
  signOut(): Promise<void>;
}

export abstract class UserManagerCreator {
  /**
   * 用户管理
   */
  public abstract userManager: UserManager;

  /**
   * 获取用户
   */
  public getUser() {
    return this.userManager.getUser();
  }

  /**
   * 触发跳转到授权页面
   */
  public signIn(noInteractive?: boolean) {
    return this.userManager.signIn(noInteractive);
  }

  /**
   * 触发静态授权请求（如iframe）
   */
  public signinSilent() {
    return this.userManager.signinSilent();
  }

  /**
   * 触发跳转到结束会话页
   */
  public signOut() {
    return this.userManager.signOut();
  }
}
