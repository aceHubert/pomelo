import { UpdateCommentValidator } from './update-comment.validator';

export class UpdateCommentDto extends UpdateCommentValidator {
  /**
   * 评论内容
   */
  content?: string;

  /**
   * 是否已审核
   */
  approved?: boolean;

  /**
   * 是否已编辑
   */
  edited?: boolean;
}
