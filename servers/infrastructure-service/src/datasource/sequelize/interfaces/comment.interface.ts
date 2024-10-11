import { Attributes, CreationAttributes } from 'sequelize';
import { Comments } from '../entities';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

export interface CommentModel extends Attributes<Comments> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface CommentMetaModel extends MetaModel {
  commentId: number;
}

export interface PagedCommentArgs extends PagedArgs {
  /**
   * template id
   */
  templateId?: number;

  /**
   * parent id
   */
  parentId?: number;
}

export interface PagedCommentModel extends Paged<CommentModel> {}

export interface NewCommentInput extends Omit<CreationAttributes<Comments>, 'userId'> {
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

export interface UpdateCommentInput extends Partial<Pick<NewCommentInput, 'content' | 'approved' | 'edited'>> {}

export interface NewCommentMetaInput extends NewMetaInput {
  commentId: number;
}
