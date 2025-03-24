import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/shared/server';
import { Optional } from './types';

/**
 * 模版内部状态
 */
export enum TemplateInnerStatus {
  AutoDraft = 'auto draft', // 新建
  Inherit = 'inherit', // 编辑副本
}

/**
 * 模版内部类型
 */
export enum TemplateInnerType {
  Revision = 'revision', // 修订版本
}

export interface TemplateAttributes {
  id: number;
  title: string;
  name: string;
  author: number;
  content: string;
  excerpt: string;
  type: string;
  status: TemplateStatus | TemplateInnerStatus;
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
