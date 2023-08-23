export enum OptionKeys {
  /** 静态资源 base URL地址 */
  SiteUrl = 'siteurl',
  /** web URL 地址 */
  Home = 'home',
  /** 文章默认分类id */
  DefaultCategory = 'default_category',
  /** 当前启用的插件 */
  ActivePlugins = 'active_plugins',
  /** 缩略图宽度，默认：150 */
  ThumbnailSizeWidth = 'thumbnail_size_w',
  /** 缩略图高度，默认：150 */
  ThumbnailSizeHeight = 'thumbnail_size_h',
  /** 缩略图裁切，值：0/1，默认：1 */
  ThumbnailCrop = 'thumbnail_crop',
  /** 中图宽度，默认：300 */
  MediumSizeWidth = 'medium_size_w',
  /** 中图高度，默认：300 */
  MediumSizeHeight = 'medium_size_h',
  /** 大图宽度，默认：1200 */
  LargeSizeWidth = 'large_size_w',
  /** 大图高度，默认：1200 */
  LargeSizeHeight = 'large_size_h',
  /** 中大图宽度，默认：768 */
  MediumLargeSizeWidth = 'medium_large_size_w',
  /** 中大图高度：默认：0（auto） */
  MediumLargeSizeHeight = 'medium_large_size_h',
  /** 默认语言 */
  Locale = 'locale',
}

export enum MediaMetaKeys {
  /** 额外参数 */
  Matedata = 'mate_data',
}

export enum TemplateMetaKeys {
  /** 在移入垃圾箱之前的状态 */
  TrashStatus = '$trash_status',
  /** 在移入垃圾箱的时间 */
  TrashTime = '$trash_time',
}

export enum UserMetaKeys {
  NickName = 'nick_name',
  FirstName = 'first_name',
  LastName = 'last_name',
  Avatar = 'avatar',
  Description = 'description',
  /** 用户使用语言 */
  Locale = 'locale',
  /** 管理平台主题颜色 */
  AdminColor = 'admin_color',
  /**
   * 角色
   * 需要添加表前缀
   */
  UserRole = 'user_role',
}
