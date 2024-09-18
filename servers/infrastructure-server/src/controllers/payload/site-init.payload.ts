import { IsDefined, IsEmail, IsLocale, IsString, IsUrl, MinLength } from 'class-validator';

export class SiteInitPayload {
  /**
   * 站点标题
   */
  @IsDefined()
  @IsString()
  title!: string;

  /**
   * admin 初始密码
   */
  @IsDefined()
  @MinLength(6)
  password!: string;

  /**
   * admin 初始邮箱
   */
  @IsDefined()
  @IsEmail()
  email!: string;

  /**
   * web端访问地址
   */
  @IsDefined()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  homeUrl!: string;

  /**
   * 静态资源地址
   */
  @IsDefined()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  siteUrl!: string;

  /**
   * 默认语言
   */
  @IsDefined()
  @IsLocale()
  locale!: string;
}
