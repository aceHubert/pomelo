/**
 * 评论类型（扩展字段）
 */
export enum CommentType {
  Comment = 'comment',
}

/**
 * 链接是否显示
 */
export enum LinkVisible {
  Yes = 'yes',
  No = 'no',
}

/**
 * 链接打开方式
 */
export enum LinkTarget {
  Blank = '_blank',
  Self = '_self',
}

/**
 * 配置自动加载
 */
export enum OptionAutoload {
  Yes = 'yes',
  No = 'no',
}

/**
 * 预设类别
 */
export enum TermPresetTaxonomy {
  Category = 'category',
  Tag = 'tag',
}

/**
 * 预设媒体无数据 Key
 */
export enum MediaMetaPresetKeys {
  /**
   * 额外参数
   */
  Matedata = 'mate_data',
}

/**
 * 模版状态
 */
export enum TemplateStatus {
  Draft = 'draft', // 草稿
  Pending = 'pending', // 待审核发布
  Publish = 'publish', // 已发布
  Private = 'private', // 私有
  Future = 'future', // 预约发布
  Trash = 'trash', // 垃圾箱
}

/**
 * 模版预设类型
 */
export enum TemplatePresetType {
  Form = 'form', // 表单
  Page = 'page', // 页面
  Post = 'post', // 文章
}

/**
 * 模版评论开启状态
 */
export enum TemplateCommentStatus {
  Open = 'open', // 允许评论
  Closed = 'closed', // 禁止评论
}

/**
 * 用户状态
 */
export enum UserStatus {
  Disabled = 0,
  Enabled = 1,
}

/**
 * 用户角色
 */
export enum UserRole {
  /**
   * 管理员
   * 所有权限
   */
  Administrator = 'administrator',
  /**
   * 编辑
   * 可管理评论、分类、链接、上传文件、编辑模板、编辑他人模板、编辑已发布模板、编辑私有模板、删除模板、删除他人模板、删除已发布模板、删除私有模板、发布模板、阅读私有
   */
  Editor = 'editor',
  /**
   * 作者
   * 可上传文件、编辑模板、编辑已发布模板、删除模板、删除已发布模板、发布模板、阅读
   */
  Author = 'author',
  /**
   * 投稿者
   * 可编辑模板、删除模板、阅读
   */
  Contributor = 'contributor',
  /**
   * 订阅者
   * 可阅读
   */
  Subscriber = 'subscriber',
  /**
   * 无任何权限
   */
  None = '',
}
