import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewMediaMetaDto extends NewMetaDto {
  /**
   * Media Id
   */
  mediaId!: number;
}
