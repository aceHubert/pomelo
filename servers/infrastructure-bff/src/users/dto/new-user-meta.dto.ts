import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewUserMetaDto extends NewMetaDto {
  /**
   * User Id
   */
  userId!: number;
}
