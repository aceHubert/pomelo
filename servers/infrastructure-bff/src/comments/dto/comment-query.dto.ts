import { ApiProperty } from '@nestjs/swagger';
import { PagedCommentArgsValidator } from './comment-args.validator';

export class PagedCommentQueryDto extends PagedCommentArgsValidator {
  /**
   * 模板ID
   */
  templateId?: number;

  /**
   * 父评论ID
   */
  parentId?: number;

  /**
   * 偏移量
   */
  @ApiProperty({ minimum: 0, default: 0 })
  offset?: number;

  /**
   * 限制数量
   */
  @ApiProperty({ minimum: 5, maximum: 100, default: 20 })
  limit?: number;
}
