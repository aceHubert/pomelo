import { ApiResponseProperty } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class CommentModelResp {
  /**
   * Comment ID
   */
  id!: number;

  /**
   * Template ID
   */
  templateId!: number;

  /**
   * Author name
   */
  author!: string;

  /**
   * Author email
   */
  authorEmail?: string;

  /**
   * Author website
   */
  authorUrl?: string;

  /**
   * Author IP
   */
  authorIp?: string;

  /**
   * Comment content
   */
  content!: string;

  /**
   * Whether approved
   */
  approved!: boolean;

  /**
   * Whether edited
   */
  edited!: boolean;

  /**
   * Comment type
   */
  type!: string;

  /**
   * User agent information
   */
  agent?: string;

  /**
   * Parent comment ID
   */
  parentId!: number;

  /**
   * User ID
   */
  userId!: number;

  /**
   * Creation time
   */
  createdAt!: Date;

  /**
   * Update time
   */
  updatedAt!: Date;
}

export class PagedCommentResp extends PagedResponse(CommentModelResp) {}

export class CommentMetaModelResp extends MetaModelResp {
  /**
   * Comment ID
   */
  @ApiResponseProperty()
  commentId!: number;
}
