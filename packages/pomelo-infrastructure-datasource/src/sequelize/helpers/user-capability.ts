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

  // posts
  EditPosts = 'edit_posts', // 编辑（包括新建）文章
  EditOthersPosts = 'edit_others_post', // 编辑别人的文章
  EditPublishedPosts = 'edit_published_posts', // 编辑发布的文章
  EditPrivatePosts = 'edit_private_posts', // 编辑私有（别人）的文章
  DeletePosts = 'delete_posts', // 删除文章
  DeleteOthersPosts = 'delete_others_posts', // 删除别人的文章
  DeletePublishedPosts = 'delete_published_posts', // 删除发布的文章
  DeletePrivatePosts = 'delete_private_posts', // 删除私有（别人）的方是
  PublishPosts = 'publish_posts', // 发布审核（别人的）文章
  ModerateComments = 'moderate_comments', // 修改评论

  // pages
  EditPages = 'edit_pages', // 编辑（包括新建）页面
  EditOthersPages = 'edit_others_pages', // 编辑别人的页面
  EditPublishedPages = 'edit_published_pages', // 编辑发布的页面
  EditPrivatePages = 'edit_private_pages', // 编辑私有（别人）的页面
  DeletePages = 'delete_pages', // 删除页面
  DeleteOthersPages = 'delete_others_pages', // 删除别人的页面
  DeletePublishedPages = 'delete_published_pages', // 删除发布的页面
  DeletePrivatePages = 'delete_private_pages', // 删除私有（别人）的页面
  PublishPages = 'publish_pages', // 发布审核（别人的）页面

  // form
  EditForms = 'edit_forms', // 编辑（包括新建）表单
  EditOthersForms = 'edit_others_forms', // 编辑别人的表单
  EditPublishedForms = 'edit_published_forms', // 编辑发布的表单
  EditPrivateForms = 'edit_private_forms', // 编辑私有（别人）的表单
  DeleteForms = 'delete_forms', // 删除表单
  DeleteOthersForms = 'delete_others_forms', // 删除别人的表单
  DeletePublishedForms = 'delete_published_forms', // 删除发布的表单
  DeletePrivateForms = 'delete_private_forms', // 删除私有（别人）的表单
  PublishForms = 'publish_forms', // 发布审核（别人的）表单

  // read
  Read = 'read', // 读取文章、页面
  ReadPrivatePosts = 'read_private_posts', // 读取私有的文章
  ReadPrivatePages = 'read_private_pages', // 读取私有的文章
  ReadPrivateForms = 'read_private_forms', // 读取私有的文章

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
