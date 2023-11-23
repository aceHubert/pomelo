import { Optional } from '../types';

/**
 * 状态
 */
export enum TemplateStatus {
  AutoDraft = 'auto draft', // 新建
  Inherit = 'inherit', // 编辑副本
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
export const TemplateOperateStatus = Object.freeze([TemplateStatus.AutoDraft, TemplateStatus.Inherit]);

/**
 * 类型
 */
export enum TemplateType {
  Revision = 'revision', // 修订版本
  Form = 'form', // 表单
  Page = 'page', // 页面
  Post = 'post', // 文章
}

/**
 * 操作类型（仅内部使用）
 */
export const TemplateOperateType = Object.freeze([TemplateType.Revision]);

export enum TemplateCommentStatus {
  Open = 'open', // 允许评论
  Closed = 'closed', // 禁止评论
}

export interface TemplateAttributes {
  id: number;
  title: string;
  name: string;
  author: number;
  content: string;
  excerpt: string;
  type: TemplateType | string;
  status: TemplateStatus;
  order: number;
  parentId?: number;
  updatedAt: Date;
  createdAt: Date;
  commentStatus: TemplateCommentStatus;
  commentCount: number;
}

export interface TemplateCreationAttributes
  extends Optional<
    TemplateAttributes,
    'id' | 'name' | 'type' | 'order' | 'parentId' | 'status' | 'commentStatus' | 'commentCount'
  > {}
