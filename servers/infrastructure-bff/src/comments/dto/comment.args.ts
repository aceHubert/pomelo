import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { PagedCommentArgsValidator } from './comment-args.validator';

@ArgsType()
export class CommentArgs extends PagedCommentArgsValidator {
  /**
   * Template ID
   */
  @Field((type) => ID)
  templateId?: number;

  /**
   * Parent comment ID
   */

  @Field((type) => ID)
  parentId?: number;

  /**
   * Page offset
   */
  @Field((type) => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Page size
   */
  @Field((type) => Int, { defaultValue: 20 })
  limit?: number;
}
