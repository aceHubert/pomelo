export enum OptionPresetKeys {
  /** 静态资源 base URL地址 */
  SiteUrl = 'siteurl',
  /** web URL 地址 */
  Home = 'home',
  /** 博客名称 */
  BlogName = 'blogname',
  /** 博客描述 */
  BlogDescription = 'blogdescription',
  /** 字符集，默认：UTF-8 */
  BlogCharset = 'blog_charset',
  /** 站点图标 */
  SiteIcon = 'site_icon',
  /** 用户是否可注册, 默认：0 */
  UsersCanRegister = 'users_can_register',
  /** 管理员邮箱 */
  AdminEmail = 'admin_email',
  /** 管理员邮箱有效期，默认：6 months */
  AdminEmialLifespan = 'admin_email_lifespan',
  /** 一周的开始(1-7)，默认：1 */
  StartOfWeek = 'start_of_week',
  /** 邮箱服务器地址 */
  MailServerUrl = 'mailserver_url',
  /** 邮箱服务器账号 */
  MailServerLogin = 'mailserver_login',
  /** 邮箱服务器账号密码 */
  MailServerPass = 'mailserver_pass',
  /** 邮箱服务器端口 */
  MailServerPort = 'mailserver_port',
  /** 默认是否开启评论，默认：open */
  DefaultComentStatus = 'default_comment_status',
  /** 文章默认分类id */
  DefaultCategory = 'default_category',
  /** 默认邮箱分类 */
  DefaultEmailCategory = 'default_email_category',
  /** 默认链接分类 */
  DefaultLinkCategory = 'default_link_category',
  /** 评论提示，默认：1 */
  CommentsNotify = 'comments_notify',
  /** 文章显示页大小，默认：10 */
  PostsPerPage = 'posts_per_page',
  /** 日期格式(https://momentjs.com/docs/#/displaying/) ，默认：L */
  DataFormat = 'date_format',
  /** 时间格式, 默认：HH:mm:ss */
  TimeFormat = 'time_format',
  /** 评论审核，默认：0 */
  CommentModeration = 'comment_moderation',
  /** 评论审核提醒，默认：1 */
  ModerationNofity = 'moderation_notify',
  /** 评论需要先注册，默认：0 */
  CommentRegistration = 'comment_registration',
  /** 评论最大链接数，默认：2 */
  CommentMaxLinks = 'comment_max_links',
  /** 线性评论显示，默认：1 */
  ThreadComments = 'thread_comments',
  /** 评论显示深度，默认：5 */
  ThreadCommentsDepth = 'thread_comments_depth',
  /** 页面是否支持评论，默认：0 */
  PageComments = 'page_comments',
  /** 评论显示页大小，默认：50 */
  CommentsPerPage = 'comments_per_page',
  /** 默认显示评论内容，默认： newest */
  DefaultCommentsPage = 'default_comments_page',
  /** 评论排序，默认：asc */
  CommentOrder = 'comment_order',
  /** 永久链接结构 */
  PermalinkStructure = 'permalink_structure',
  /** 当前启用的插件 */
  ActivePlugins = 'active_plugins',
  /** 卸载的插件 */
  UninstallPlugins = 'uninstall_plugins',
  /** 当前主题模版 */
  Template = 'template',
  /** 当前样式表模版 */
  Stylesheet = 'stylesheet',
  /** 格林尼治时间 */
  GmtOffset = 'gmt_offset',
  /** 时区 */
  TimezoneString = 'timezone_string',
  /** 默认角色，默认：Subscriber */
  DefaultRole = 'default_role',
  /** 首页显示 posts/page, 默认：posts */
  ShowOnFront = 'show_on_front',
  /** 首页展示文章 */
  PageForPosts = 'page_for_posts',
  /** 首页展示页面 */
  PageOnFront = 'page_on_front',
  /** 默认文章显示，默认：aside */
  DefaultPostFormat = 'default_post_format',
  /** 显示头像，默认：1 */
  ShowAvatars = 'show_avatars',
  /** 头像评级，默认：G */
  AvatarRating = 'avatar_rating',
  /** 默认头像 */
  AvatarDefault = 'avatar_default',
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
  /** 图片链接默认类型 */
  ImageDefaultLinkType = 'image_default_link_type',
  /** 图片默认大小 */
  ImageDefaultSize = 'image_default_size',
  /** 图片默认对齐方式 */
  ImageDefaultAlign = 'image_default_align',
  /** 链接管理启用，默认：0 */
  LinkManagerEnabled = 'link_manager_enabled',
  // /** 初始化DB版本 */
  // InitialDbVersion = 'initial_db_version',
  // /** DB版本 */
  // DbVersion = 'db_version',
  /** 是否可以压缩脚本, 默认：0 */
  CanCompressScripts = 'can_compress_scripts',
  /** 电话号码区域（https://github.com/catamphetamine/libphonenumber-js/issues/170#issuecomment-363156068），默认：CN */
  DefaultPhoneNumberRegion = 'default_phone_number_region',
  /**>>> 以下需要添加 table 前缀 <<<*/
  /** 默认语言 */
  Locale = 'locale',
  /**角色权限 */
  UserRoles = 'user_roles',
  /** 隐私页面 */
  PageForPrivacyPolicy = 'page_for_privacy_policy',
}

export enum MediaMetaPresetKeys {
  /** 额外参数 */
  Matedata = 'mate_data',
}

export enum TemplateMetaPresetKeys {
  /** 在移入垃圾箱之前的状态 */
  TrashStatus = '$trash_status',
  /** 在移入垃圾箱的时间 */
  TrashTime = '$trash_time',
}

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
  /**>>> 以下需要添加 table 前缀 <<<*/
  /** 角色权限 */
  Capabilities = 'capabilities',
}
