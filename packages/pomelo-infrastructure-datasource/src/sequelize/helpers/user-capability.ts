/**
 * 角色权限
 */
export enum UserCapability {
  // themes
  InstallThemes = 'install_themes', // 安装主题
  SwitchThemes = 'switch_themes', // 切换主题
  EditThemes = 'edit_themes', // 编辑主题文件（待定）
  EditThemeOptions = 'edit_theme_options', // Admin 主题配置
  UpgradeThemes = 'upgrade_themes', // 升级主题
  UploadThemes = 'upload_themes', // 上传主题
  Customize = 'customize', // 配置主题
  DeleteThemes = 'delete_themes', // 卸载主题

  // plugins
  InstallPlugins = 'install_plugins', // 安装插件
  ActivatePlugins = 'activate_plugins', // 启动插件
  EditPlugins = 'edit_plugins', // 编辑插件文件（待定）
  UpgradePlguins = 'upgrade_plugins', // 升级插件
  UploadPlugins = 'upload_plugins', // 上传插件
  DeletePlugins = 'delete_plugins', // 卸载插件

  // users
  ListUsers = 'list_users', // 查看用户列表
  CreateUsers = 'create_users', // 创建用户
  EditUsers = 'edit_users', // 编辑用户
  DeleteUsers = 'delete_users', // 删除用户
  PromoteUser = 'promote_users', // 升级用户权限

  // templates
  EditTemplates = 'edit_templates', // 编辑（包括新建）模版
  EditOthersTemplates = 'edit_others_templates', // 编辑别人的模版
  EditPublishedTemplates = 'edit_published_templates', // 编辑发布的模版
  EditPrivateTemplates = 'edit_private_templates', // 编辑私有（别人）的模版
  DeleteTemplates = 'delete_templates', // 删除模版
  DeleteOthersTemplates = 'delete_others_templates', // 删除别人的模版
  DeletePublishedTemplates = 'delete_published_templates', // 删除发布的模版
  DeletePrivateTemplates = 'delete_private_templates', // 删除私有（别人）的模版
  PublishTemplates = 'publish_templates', // 发布审核（别人的）模版
  ModerateComments = 'moderate_comments', // 修改评论

  // read
  Read = 'read', // 读取模版
  ReadPrivate = 'read_private', // 读取私有的模版

  // others
  EditFiles = 'edit_files', // 编辑文件
  UploadFiles = 'upload_files', // 上传文件
  ManageOptions = 'manage_options', // 管理 option 配置
  ManageCategories = 'manage_categories', // 管理分类
  ManageTags = 'manage_tags', // 管理标签
  ManageLinks = 'manage_links', // 管理链接
  UpgradeCore = 'upgrade_core', // 系统升级
  EditDashboard = 'edit_dashboard', // 编辑仪表盘
  Import = 'import', // 导入
  Export = 'export', // 导出
}
