import { NewUserMetaInput as INewUserMetaInput } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewUserMetaDto extends NewMetaDto implements INewUserMetaInput {
  /**
   * User Id
   */
  userId!: number;
}
