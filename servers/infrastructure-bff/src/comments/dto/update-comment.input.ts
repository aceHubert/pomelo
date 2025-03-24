import { InputType } from '@nestjs/graphql';
import { UpdateCommentValidator } from './update-comment.validator';

@InputType({ description: 'Update comment input' })
export class UpdateCommentInput extends UpdateCommentValidator {
  /**
   * Comment content
   */
  content?: string;

  /**
   * Is approved
   */
  approved?: boolean;

  /**
   * Is edited
   */
  edited?: boolean;
}
