import { NewUserMetaInput as INewUserMetaInput } from '@ace-pomelo/datasource';
import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewUserMetaDto extends NewMetaDto implements INewUserMetaInput {
  /**
   * User Id
   */
  userId!: number;
}
