export enum TemplateStatus {
  Draft = 'Draft', // 草稿
  Pending = 'Pending', // 等审核
  Publish = 'Publish', // 已发布
  Private = 'Private', // 私有，暂未使用
  Future = 'Future', // 定时发布，暂未使用
  Trash = 'Trash', // 垃圾箱
}

export enum TemplatePageType {
  Default = 'default',
  Cover = 'cover',
  FullWidth = 'full-width',
}

export enum TemplateCommentStatus {
  Open = 'Open',
  Closed = 'Closed',
}
