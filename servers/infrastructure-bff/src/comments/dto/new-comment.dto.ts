import { ApiProperty } from '@nestjs/swagger';
import { CommentType } from '@ace-pomelo/shared/server';
import { NewCommentValidator } from './new-comment.validator';

export class NewCommentDto extends NewCommentValidator {
  /**
   * Template ID
   */
  templateId!: number;

  /**
   * Comment content
   */
  content!: string;

  /**
   * Comment type
   */
  @ApiProperty({
    enum: CommentType,
    required: false,
    description: 'Comment type',
  })
  type!: CommentType;

  /**
   * User agent
   */
  agent?: string;

  /**
   * Parent comment ID
   */
  parentId?: number;
}
