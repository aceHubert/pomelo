import { Field, ID, InputType } from '@nestjs/graphql';
import { CommentType } from '@ace-pomelo/shared/server';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewCommentValidator } from './new-comment.validator';

@InputType({ description: 'Create new comment input' })
export class NewCommentInput extends NewCommentValidator {
  /**
   * Template ID
   */
  @Field(() => ID)
  templateId!: number;

  /**
   * Comment content
   */
  content!: string;

  /**
   * Comment type
   * @default comment
   */
  @Field(() => CommentType, { defaultValue: CommentType.Comment })
  type!: CommentType;

  /**
   * Parent comment ID
   */
  @Field(() => ID)
  parentId?: number;

  /**
   * New metas
   */
  metas?: NewMetaInput[];
}
