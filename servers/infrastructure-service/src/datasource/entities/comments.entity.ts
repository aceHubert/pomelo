import { CommentType } from '@ace-pomelo/shared/server';
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
  type: CommentType;
  agent?: string;
  parentId: number;
  userId: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id'> {}
