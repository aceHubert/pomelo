import { NewMediaMetaInput as INewMediaMetaInput } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewMediaMetaDto extends NewMetaDto implements INewMediaMetaInput {
  /**
   * Media Id
   */
  mediaId!: number;
}
