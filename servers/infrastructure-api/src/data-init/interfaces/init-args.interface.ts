export interface InitArgs {
  /**
   * 站点标题
   */
  title: string;
  /**
   * admin 初始密码
   */
  password: string;
  /**
   * admin 初始邮箱
   */
  email: string;
  /**
   * web端访问地址
   */
  homeUrl: string;
  /**
   * 静态资源地址
   */
  siteUrl: string;
  /**
   * 默认语言
   */
  locale: string;
}
