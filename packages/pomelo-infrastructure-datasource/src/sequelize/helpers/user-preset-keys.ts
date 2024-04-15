export enum UserMetaPresetKeys {
  /** 昵称，必填 */
  NickName = 'nick_name',
  /** 名 */
  FirstName = 'first_name',
  /** 性 */
  LastName = 'last_name',
  /** 头像 */
  Avatar = 'avatar',
  /** 个人描述 */
  Description = 'description',
  /** 用户使用语言 */
  Locale = 'locale',
  /** 管理平台主题颜色 */
  AdminColor = 'admin_color',
  /** 是否超级管理员 */
  SuperAdministrator = 'super_administrator',
  /** 待验证的邮箱 */
  VerifingEmail = 'verifing_email',
  /** 待验证的手机号码 */
  VerifingPhone = 'verifing_phone',
  /**>>> 以下需要添加 table 前缀 <<<*/
  /** 角色权限 */
  Capabilities = 'capabilities',
}
