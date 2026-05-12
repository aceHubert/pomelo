import { OptionPresetKeys } from '@ace-pomelo/shared/server';

/**
 * Option 访问等级。
 * public-read: 任何人可读。
 * authenticated-read: 登录用户可读。
 * admin-read-write: 管理员可读写。
 * secret-write-only: 管理员只能写入，读取接口不返回明文。
 */
export type OptionAccessLevel = 'public-read' | 'authenticated-read' | 'admin-read-write' | 'secret-write-only';

export interface OptionDefinition {
  key: OptionPresetKeys;
  access: OptionAccessLevel;
  /** 未设置时的默认值（可选，仅对非敏感配置提供）。 */
  defaultValue?: string;
  /** 是否为必填邮箱发送配置，未设置时返回中文友好提示。 */
  requiredForMail?: boolean;
  /** 字段描述，用于管理端展示。 */
  description?: string;
}

export const OPTION_DEFINITIONS: OptionDefinition[] = [
  // public-read
  { key: OptionPresetKeys.SiteUrl, access: 'public-read', description: '静态资源 base URL 地址' },
  { key: OptionPresetKeys.Home, access: 'public-read', description: 'Web URL 地址' },
  { key: OptionPresetKeys.BlogName, access: 'public-read', description: '博客名称' },
  {
    key: OptionPresetKeys.BlogDescription,
    access: 'public-read',
    defaultValue: 'Just another Pomelo site',
    description: '博客描述',
  },
  { key: OptionPresetKeys.SiteIcon, access: 'public-read', defaultValue: '', description: '站点图标' },

  // admin-read-write
  { key: OptionPresetKeys.BlogCharset, access: 'admin-read-write', defaultValue: 'UTF-8', description: '字符集' },
  {
    key: OptionPresetKeys.UsersCanRegister,
    access: 'admin-read-write',
    defaultValue: '0',
    description: '是否允许注册',
  },
  { key: OptionPresetKeys.AdminEmail, access: 'admin-read-write', description: '管理员邮箱' },
  { key: OptionPresetKeys.AdminEmialLifespan, access: 'admin-read-write', description: '管理员邮箱有效期' },
  { key: OptionPresetKeys.StartOfWeek, access: 'admin-read-write', defaultValue: '1', description: '一周开始日期' },
  {
    key: OptionPresetKeys.MailServerUrl,
    access: 'admin-read-write',
    requiredForMail: true,
    description: '邮箱服务器地址',
  },
  {
    key: OptionPresetKeys.MailServerLogin,
    access: 'admin-read-write',
    requiredForMail: true,
    description: '邮箱服务器账号',
  },
  {
    key: OptionPresetKeys.MailServerPort,
    access: 'admin-read-write',
    defaultValue: '110',
    description: '邮箱服务器端口',
  },
  {
    key: OptionPresetKeys.DefaultComentStatus,
    access: 'admin-read-write',
    defaultValue: 'open',
    description: '默认评论开启状态',
  },
  { key: OptionPresetKeys.DefaultCategory, access: 'admin-read-write', description: '默认文章分类' },
  { key: OptionPresetKeys.DefaultEmailCategory, access: 'admin-read-write', description: '默认邮箱分类' },
  { key: OptionPresetKeys.DefaultLinkCategory, access: 'admin-read-write', description: '默认链接分类' },
  { key: OptionPresetKeys.DefaultMediaCategory, access: 'admin-read-write', description: '默认媒体分类' },
  { key: OptionPresetKeys.CommentsNotify, access: 'admin-read-write', defaultValue: '1', description: '评论通知' },
  { key: OptionPresetKeys.PostsPerPage, access: 'admin-read-write', defaultValue: '10', description: '文章每页数量' },
  { key: OptionPresetKeys.DataFormat, access: 'admin-read-write', defaultValue: 'L', description: '日期格式' },
  { key: OptionPresetKeys.TimeFormat, access: 'admin-read-write', defaultValue: 'HH:mm:ss', description: '时间格式' },
  { key: OptionPresetKeys.CommentModeration, access: 'admin-read-write', defaultValue: '0', description: '评论审核' },
  {
    key: OptionPresetKeys.ModerationNofity,
    access: 'admin-read-write',
    defaultValue: '1',
    description: '评论审核提醒',
  },
  {
    key: OptionPresetKeys.CommentRegistration,
    access: 'admin-read-write',
    defaultValue: '0',
    description: '评论需要注册',
  },
  {
    key: OptionPresetKeys.CommentMaxLinks,
    access: 'admin-read-write',
    defaultValue: '2',
    description: '评论最大链接数',
  },
  { key: OptionPresetKeys.ThreadComments, access: 'admin-read-write', defaultValue: '1', description: '线性评论显示' },
  {
    key: OptionPresetKeys.ThreadCommentsDepth,
    access: 'admin-read-write',
    defaultValue: '5',
    description: '评论嵌套深度',
  },
  { key: OptionPresetKeys.PageComments, access: 'admin-read-write', defaultValue: '0', description: '页面评论' },
  {
    key: OptionPresetKeys.CommentsPerPage,
    access: 'admin-read-write',
    defaultValue: '50',
    description: '评论每页数量',
  },
  {
    key: OptionPresetKeys.DefaultCommentsPage,
    access: 'admin-read-write',
    defaultValue: 'newest',
    description: '默认评论页',
  },
  { key: OptionPresetKeys.CommentOrder, access: 'admin-read-write', defaultValue: 'asc', description: '评论排序' },
  {
    key: OptionPresetKeys.PermalinkStructure,
    access: 'admin-read-write',
    defaultValue: '',
    description: '永久链接结构',
  },
  { key: OptionPresetKeys.ActivePlugins, access: 'admin-read-write', defaultValue: '[]', description: '启用插件' },
  { key: OptionPresetKeys.UninstallPlugins, access: 'admin-read-write', defaultValue: '[]', description: '卸载插件' },
  { key: OptionPresetKeys.Template, access: 'admin-read-write', defaultValue: 'beauty', description: '当前主题模板' },
  {
    key: OptionPresetKeys.Stylesheet,
    access: 'admin-read-write',
    defaultValue: 'beauty',
    description: '当前样式表模板',
  },
  { key: OptionPresetKeys.GmtOffset, access: 'admin-read-write', description: 'GMT 偏移' },
  { key: OptionPresetKeys.TimezoneString, access: 'admin-read-write', description: '时区' },
  {
    key: OptionPresetKeys.DefaultRole,
    access: 'admin-read-write',
    defaultValue: 'subscriber',
    description: '默认用户角色',
  },
  { key: OptionPresetKeys.ShowOnFront, access: 'admin-read-write', defaultValue: 'posts', description: '首页显示类型' },
  { key: OptionPresetKeys.PageForPosts, access: 'admin-read-write', defaultValue: '', description: '文章列表页' },
  { key: OptionPresetKeys.PageOnFront, access: 'admin-read-write', defaultValue: '', description: '首页页面' },
  {
    key: OptionPresetKeys.DefaultPostFormat,
    access: 'admin-read-write',
    defaultValue: 'aside',
    description: '默认文章格式',
  },
  { key: OptionPresetKeys.ShowAvatars, access: 'admin-read-write', defaultValue: '1', description: '显示头像' },
  { key: OptionPresetKeys.AvatarRating, access: 'admin-read-write', defaultValue: 'G', description: '头像评级' },
  {
    key: OptionPresetKeys.AvatarDefault,
    access: 'admin-read-write',
    defaultValue: 'default.png',
    description: '默认头像',
  },
  {
    key: OptionPresetKeys.ThumbnailSizeWidth,
    access: 'admin-read-write',
    defaultValue: '150',
    description: '缩略图宽度',
  },
  {
    key: OptionPresetKeys.ThumbnailSizeHeight,
    access: 'admin-read-write',
    defaultValue: '150',
    description: '缩略图高度',
  },
  { key: OptionPresetKeys.ThumbnailCrop, access: 'admin-read-write', defaultValue: '1', description: '缩略图裁切' },
  { key: OptionPresetKeys.MediumSizeWidth, access: 'admin-read-write', defaultValue: '300', description: '中图宽度' },
  { key: OptionPresetKeys.MediumSizeHeight, access: 'admin-read-write', defaultValue: '300', description: '中图高度' },
  { key: OptionPresetKeys.LargeSizeWidth, access: 'admin-read-write', defaultValue: '1200', description: '大图宽度' },
  { key: OptionPresetKeys.LargeSizeHeight, access: 'admin-read-write', defaultValue: '1200', description: '大图高度' },
  {
    key: OptionPresetKeys.MediumLargeSizeWidth,
    access: 'admin-read-write',
    defaultValue: '768',
    description: '中大图宽度',
  },
  {
    key: OptionPresetKeys.MediumLargeSizeHeight,
    access: 'admin-read-write',
    defaultValue: '0',
    description: '中大图高度',
  },
  {
    key: OptionPresetKeys.ImageDefaultLinkType,
    access: 'admin-read-write',
    defaultValue: '',
    description: '图片默认链接类型',
  },
  { key: OptionPresetKeys.ImageDefaultSize, access: 'admin-read-write', defaultValue: '', description: '图片默认尺寸' },
  {
    key: OptionPresetKeys.ImageDefaultAlign,
    access: 'admin-read-write',
    defaultValue: '',
    description: '图片默认对齐',
  },
  {
    key: OptionPresetKeys.LinkManagerEnabled,
    access: 'admin-read-write',
    defaultValue: '0',
    description: '链接管理启用',
  },
  {
    key: OptionPresetKeys.CanCompressScripts,
    access: 'admin-read-write',
    defaultValue: '0',
    description: '脚本压缩能力',
  },
  {
    key: OptionPresetKeys.DefaultPhoneNumberRegion,
    access: 'admin-read-write',
    defaultValue: 'CN',
    description: '默认手机号区域',
  },
  { key: OptionPresetKeys.Locale, access: 'admin-read-write', description: '默认语言' },
  { key: OptionPresetKeys.UserRoles, access: 'admin-read-write', description: '用户角色权限' },
  {
    key: OptionPresetKeys.PageForPrivacyPolicy,
    access: 'admin-read-write',
    defaultValue: '',
    description: '隐私政策页面',
  },

  // secret-write-only
  {
    key: OptionPresetKeys.MailServerPass,
    access: 'secret-write-only',
    requiredForMail: true,
    description: '邮箱服务器账号密码',
  },
];

export const OPTION_DEFINITION_MAP: Record<string, OptionDefinition> = Object.fromEntries(
  OPTION_DEFINITIONS.map((def) => [def.key, def]),
);

export const MAIL_REQUIRED_OPTION_KEYS: OptionPresetKeys[] = OPTION_DEFINITIONS.filter(
  ({ requiredForMail }) => requiredForMail,
).map(({ key }) => key);
