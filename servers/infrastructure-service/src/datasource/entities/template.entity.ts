import { Optional } from '../shared/types';

export interface TemplateAttributes {
  id: number;
  title: string;
  name: string;
  author: number;
  content: string;
  excerpt: string;
  type: string;
  status: string;
  order: number;
  parentId?: number;
  updatedAt: Date;
  createdAt: Date;
  /**
   * open/close
   */
  commentStatus: string;
  commentCount: number;
}

export interface TemplateCreationAttributes
  extends Optional<
    TemplateAttributes,
    'id' | 'name' | 'type' | 'order' | 'parentId' | 'status' | 'commentStatus' | 'commentCount'
  > {}
