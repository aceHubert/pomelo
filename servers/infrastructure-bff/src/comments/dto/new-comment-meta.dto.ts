import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewCommentMetaDto extends NewMetaDto {
  /**
   * Comment Id
   */
  commentId!: number;
}
