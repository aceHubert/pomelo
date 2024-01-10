/**
 * 用户管理基类
 * TODO: 考虑一下用 interface 还是 abstract class
 */
export interface UserManager<SigninArgs = any, SignoutArgs = any, User = any> {
  /**
   * 获取用户
   */
  getUser(): Promise<User | null>;
  /**
   * 触发跳转到授权页面, 并确保登录完成后跳转到当前页面
   */
  signin(args?: SigninArgs): Promise<void>;
  /**
   * 触发跳转到结束会话页
   */
  signout(args?: SignoutArgs): Promise<void>;
}
