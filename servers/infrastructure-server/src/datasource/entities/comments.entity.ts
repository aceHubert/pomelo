import { Optional } from './types';

export interface CommentAttributes {
  id: number;
  templateId: number;
  author: string;
  authorEmail?: string;
  authorUrl?: string;
  authorIp?: string;
  content: string;
  approved: boolean;
  edited: boolean;
  type: string;
  agent?: string;
  parentId: number;
  userId: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id'> {}
