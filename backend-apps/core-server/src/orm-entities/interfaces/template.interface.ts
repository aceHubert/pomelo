/**
 * 状态
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
 * 操作状态（仅内部使用）
 */
export enum TemplateOperateStatus {
  AutoDraft = 'auto draft', // 新建
  Inherit = 'inherit', // 编辑
}

/**
 * 类型
 */
export enum TemplateType {
  Form = 'form', // 表单
  Page = 'page', // 页面
  Post = 'post', // 文章
}

export interface TemplateAttributes {
  id: number;
  title: string;
  name: string;
  author: string;
  content: string;
  excerpt: string;
  type: TemplateType | string;
  status: TemplateStatus | TemplateOperateStatus;
  order: number;
  parentId?: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface TemplateCreationAttributes
  extends Optional<TemplateAttributes, 'id' | 'name' | 'type' | 'order' | 'parentId' | 'status'> {}
