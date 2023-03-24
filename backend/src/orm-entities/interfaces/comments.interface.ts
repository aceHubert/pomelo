/**
 * 评论类型（扩展字段）
 */
export enum CommentType {
  Comment = 'comment',
}

export interface CommentAttributes {
  id: number;
  templateId: number;
  author: string;
  authorEmail: string;
  authorUrl: string;
  authorIp: string;
  content: string;
  approved: boolean;
  edited: boolean;
  type: CommentType;
  agent: string;
  parentId: number;
  userId: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface CommentCreationAttributes
  extends Optional<
    CommentAttributes,
    'id' | 'authorEmail' | 'authorUrl' | 'authorIp' | 'approved' | 'edited' | 'type' | 'agent' | 'parentId' | 'userId'
  > {}
